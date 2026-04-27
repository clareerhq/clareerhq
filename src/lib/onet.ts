// ─────────────────────────────────────────────────────────────────────────────
//  O*NET Web Services API Client — v2 (api-v2.onetcenter.org)
//  Docs: https://services.onetcenter.org/reference/
// ─────────────────────────────────────────────────────────────────────────────

import type { OnetSearchResult, OnetOccupation, OnetDomainData, AssessmentDomain, DOMAIN_ENDPOINT } from '@/types/onet';
import { DOMAIN_ENDPOINT as ENDPOINTS } from '@/types/onet';

const ONET_BASE = 'https://services.onetcenter.org/ws';

/**
 * O*NET Web Services uses HTTP Basic Auth.
 * Set ONET_USERNAME (your registered email) and ONET_PASSWORD (your assigned key)
 * in your environment, or set ONET_API_KEY as "username:password" combined.
 */
function getAuthHeader(): string {
  // Support both combined key and separate username/password
  const combined = process.env.ONET_API_KEY;
  if (combined && combined.includes(':')) {
    return `Basic ${Buffer.from(combined).toString('base64')}`;
  }

  const username = process.env.ONET_USERNAME;
  const password = process.env.ONET_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'O*NET credentials missing. Set ONET_USERNAME + ONET_PASSWORD (or ONET_API_KEY=username:password) in your environment. ' +
      'Register at https://services.onetcenter.org/developer/'
    );
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function onetFetch<T>(path: string): Promise<T> {
  const url = `${ONET_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: 'application/json',
    },
    cache: 'no-store', // Don't cache — avoids stale 401s if credentials change
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

// ── Career Clusters ───────────────────────────────────────────────────────────
// v2 endpoint: /online/browse/cluster
// Returns the 16 official O*NET Career Clusters with codes and titles.
// Each cluster groups occupations by domain (e.g. "Business Management &
// Administration") rather than SOC function/level — making it the right
// navigation layer for "what field am I in?" questions.

export interface CareerCluster {
  code: string;
  title: string;
  href?: string;
}

export interface CareerClusterList {
  cluster: CareerCluster[];
}

export interface CareerSubCluster {
  code: string;
  title: string;
  href?: string;
}

export interface ClusterOccupation {
  code: string;
  title: string;
  href?: string;
  tags?: { bright_outlook?: boolean; green?: boolean };
  career_cluster?: CareerCluster[];
  sub_cluster?: CareerSubCluster[];
}

export interface CareerClusterDetail {
  cluster: CareerCluster;
  sub_cluster?: CareerSubCluster[];
  occupation: ClusterOccupation[];
  start: number;
  end: number;
  total: number;
}

/** Fetch all 16 O*NET Career Clusters. */
export async function getCareerClusters(): Promise<CareerClusterList> {
  return onetFetch<CareerClusterList>('/online/browse/cluster');
}

/**
 * Fetch all occupations belonging to a specific Career Cluster.
 * clusterCode examples: "01" (Agriculture), "04" (Business Mgmt & Admin), etc.
 * Pass start/end for pagination (default: first 100).
 */
export async function getOccupationsByCluster(
  clusterCode: string,
  start = 1,
  end = 100
): Promise<CareerClusterDetail> {
  const params = new URLSearchParams({ start: start.toString(), end: end.toString() });
  return onetFetch<CareerClusterDetail>(
    `/online/browse/cluster/${encodeURIComponent(clusterCode)}?${params}`
  );
}

/**
 * Given an O*NET occupation code, return its Career Cluster(s) and sub-cluster(s).
 * Uses the occupation summary endpoint which includes cluster tags.
 */
export interface OccupationClusterInfo {
  code: string;
  title: string;
  career_cluster: CareerCluster[];
  sub_cluster: CareerSubCluster[];
}

export async function getOccupationClusters(occupationCode: string): Promise<OccupationClusterInfo> {
  const raw = await onetFetch<Record<string, unknown>>(
    `/online/occupations/${encodeURIComponent(occupationCode)}/`
  );
  return {
    code: (raw.code as string) ?? occupationCode,
    title: (raw.title as string) ?? occupationCode,
    career_cluster: (raw.career_cluster as CareerCluster[]) ?? [],
    sub_cluster: (raw.sub_cluster as CareerSubCluster[]) ?? [],
  };
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
