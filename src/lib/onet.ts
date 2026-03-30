// ─────────────────────────────────────────────────────────────────────────────
//  O*NET Web Services API Client — v2 (api-v2.onetcenter.org)
//  Docs: https://services.onetcenter.org/reference/
// ─────────────────────────────────────────────────────────────────────────────

import type { OnetSearchResult, OnetOccupation, OnetDomainData, AssessmentDomain, DOMAIN_ENDPOINT } from '@/types/onet';
import { DOMAIN_ENDPOINT as ENDPOINTS } from '@/types/onet';

const ONET_BASE = 'https://api-v2.onetcenter.org';

function getApiKey(): string {
  const apiKey = process.env.ONET_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ONET_API_KEY must be set in environment variables. ' +
      'Find your API key at https://services.onetcenter.org/developer/'
    );
  }
  return apiKey;
}

async function onetFetch<T>(path: string): Promise<T> {
  const url = `${ONET_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'X-API-Key': getApiKey(),
      Accept: 'application/json',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour (O*NET data rarely changes)
  });

  if (!res.ok) {
    throw new Error(`O*NET API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ── Occupation Search ─────────────────────────────────────────────────────────
// v2 endpoint: /mnm/search — returns 'career' array (normalized to 'occupation')

export async function searchOccupations(keyword: string, start = 1, end = 20): Promise<OnetSearchResult> {
  const params = new URLSearchParams({
    keyword,
    start: start.toString(),
    end: end.toString(),
  });
  const raw = await onetFetch<Record<string, unknown>>(`/mnm/search?${params}`);
  // v2 API returns 'career' array; normalize to 'occupation' for internal consistency
  return {
    keyword: raw.keyword as string,
    start: raw.start as number,
    end: raw.end as number,
    total: raw.total as number,
    occupation: ((raw.career ?? raw.occupation) as OnetOccupation[]) ?? [],
  };
}

// ── Occupation Details ────────────────────────────────────────────────────────
// v2 endpoint: /mnm/career/{code}

export interface OccupationDetails {
  code: string;
  title: string;
  description?: string;
  sample_of_reported_job_titles?: { title: string[] };
  tags?: {
    bright_outlook?: boolean;
    green?: boolean;
  };
  also_see?: Array<{ code: string; title: string }>;
}

export async function getOccupationDetails(code: string): Promise<OccupationDetails> {
  // Try MNM first (richer data); fall back to online API which covers all O*NET occupations
  try {
    return await onetFetch<OccupationDetails>(`/mnm/careers/${encodeURIComponent(code)}/`);
  } catch {
    const raw = await onetFetch<Record<string, unknown>>(
      `/online/occupations/${encodeURIComponent(code)}/`
    );
    return {
      code: (raw.code as string) ?? code,
      title: (raw.title as string) ?? code,
      description: raw.description as string | undefined,
      tags: raw.tags as OccupationDetails['tags'] | undefined,
    };
  }
}

// ── Domain Data ───────────────────────────────────────────────────────────────
// v2 endpoint: /mnm/career/{code}/{endpoint}
// Domain endpoint name mapping is in DOMAIN_ENDPOINT (types/onet.ts)

export async function getDomainData(
  occupationCode: string,
  domain: AssessmentDomain
): Promise<OnetDomainData> {
  const endpoint = ENDPOINTS[domain];
  // Online API has full element lists; request up to 50 at once to avoid pagination
  const data = await onetFetch<OnetDomainData>(
    `/online/occupations/${encodeURIComponent(occupationCode)}/summary/${endpoint}?start=1&end=50`
  );

  // If online API returns empty elements, fall back to MNM which covers newer occupations.
  // MNM returns nested skill groups — flatten them into a single element list.
  if ((data.element ?? []).length === 0) {
    try {
      type MnmGroup = { id: string; name: string; element?: Array<{ id: string; name: string }> };
      const mnm = await onetFetch<MnmGroup[]>(
        `/mnm/careers/${encodeURIComponent(occupationCode)}/${endpoint}`
      );
      if (Array.isArray(mnm)) {
        const flat = mnm.flatMap((group) => group.element ?? [{ id: group.id, name: group.name }]);
        return { ...data, element: flat as OnetDomainData['element'] };
      }
    } catch {
      // MNM fallback also failed — return original empty result
    }
  }

  return data;
}

// ── Bright Outlook Occupations ─────────────────────────────────────────────────
// v2 endpoint: /mnm/listings/bright

export interface BrightOutlookResult {
  occupation: Array<{ code: string; title: string }>;
}

export async function getBrightOutlookOccupations(): Promise<BrightOutlookResult> {
  const raw = await onetFetch<Record<string, unknown>>('/mnm/listings/bright');
  // v2 returns 'career' array; normalize to 'occupation'
  return {
    occupation: ((raw.career ?? raw.occupation) as Array<{ code: string; title: string }>) ?? [],
  };
}

// ── Related Occupations ───────────────────────────────────────────────────────
// v2 endpoint: /mnm/career/{code}/explore

export interface RelatedOccupationsResult {
  occupation: Array<{
    code: string;
    title: string;
    tags?: { bright_outlook?: boolean };
  }>;
}

export async function getRelatedOccupations(
  occupationCode: string
): Promise<RelatedOccupationsResult> {
  const raw = await onetFetch<Record<string, unknown>>(
    `/mnm/careers/${encodeURIComponent(occupationCode)}/explore`
  );
  return {
    occupation: ((raw.career ?? raw.occupation) as Array<{ code: string; title: string }>) ?? [],
  };
}

// ── Wage & Employment Data ─────────────────────────────────────────────────────
// v2 endpoint: /mnm/career/{code}/outlook (wage/job outlook info)

export interface WageData {
  occupation: { code: string; title: string };
  wage: Array<{
    scale: { id: string; name: string };
    annual?: number;
    hourly?: number;
  }>;
}

export async function getWageData(occupationCode: string): Promise<WageData> {
  return onetFetch<WageData>(`/mnm/careers/${encodeURIComponent(occupationCode)}/outlook`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the top N elements by importance score from a domain.
 * Filters out elements with very low importance (< 2.0 on O*NET 1-5 scale).
 */
export function getTopElements(data: OnetDomainData, n = 15) {
  const elements = data.element ?? [];
  const hasScores = elements.some((el) => el.score?.value !== undefined);
  if (hasScores) {
    // Full scored data: filter by importance and sort
    return elements
      .filter((el) => (el.score?.value ?? 0) >= 2.0)
      .sort((a, b) => (b.score?.value ?? 0) - (a.score?.value ?? 0))
      .slice(0, n);
  }
  // Online summary data: already filtered to relevant elements, just take top N
  return elements.slice(0, n);
}
