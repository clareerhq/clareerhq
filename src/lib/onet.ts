// ─────────────────────────────────────────────────────────────────────────────
//  O*NET Web Services API Client
//  Docs: https://services.onetcenter.org/developer/
// ─────────────────────────────────────────────────────────────────────────────

import type { OnetSearchResult, OnetDomainData, AssessmentDomain, DOMAIN_ENDPOINT } from '@/types/onet';
import { DOMAIN_ENDPOINT as ENDPOINTS } from '@/types/onet';

const ONET_BASE = 'https://services.onetcenter.org/ws';

function getAuthHeader(): string {
  const username = process.env.ONET_USERNAME;
  const password = process.env.ONET_PASSWORD;
  if (!username || !password) {
    throw new Error('ONET_USERNAME and ONET_PASSWORD must be set in environment variables. Register free at https://services.onetcenter.org/developer/');
  }
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

async function onetFetch<T>(path: string): Promise<T> {
  const url = `${ONET_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
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

export async function searchOccupations(keyword: string, start = 1, end = 20): Promise<OnetSearchResult> {
  const params = new URLSearchParams({
    keyword,
    start: start.toString(),
    end: end.toString(),
  });
  return onetFetch<OnetSearchResult>(`/search?${params}`);
}

// ── Occupation Details ────────────────────────────────────────────────────────

export interface OccupationDetails {
  code: string;
  title: string;
  description: string;
  sample_of_reported_job_titles?: { title: string[] };
  tags?: {
    bright_outlook?: boolean;
    green?: boolean;
  };
  also_see?: Array<{ code: string; title: string }>;
}

export async function getOccupationDetails(code: string): Promise<OccupationDetails> {
  return onetFetch<OccupationDetails>(`/occupations/${encodeURIComponent(code)}`);
}

// ── Domain Data ───────────────────────────────────────────────────────────────

export async function getDomainData(
  occupationCode: string,
  domain: AssessmentDomain
): Promise<OnetDomainData> {
  const endpoint = ENDPOINTS[domain];
  return onetFetch<OnetDomainData>(
    `/occupations/${encodeURIComponent(occupationCode)}/${endpoint}`
  );
}

// ── Bright Outlook Occupations ─────────────────────────────────────────────────

export interface BrightOutlookResult {
  occupation: Array<{ code: string; title: string }>;
}

export async function getBrightOutlookOccupations(): Promise<BrightOutlookResult> {
  return onetFetch<BrightOutlookResult>('/bright_outlook_occupations');
}

// ── Related Occupations ───────────────────────────────────────────────────────

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
  return onetFetch<RelatedOccupationsResult>(
    `/occupations/${encodeURIComponent(occupationCode)}/related_occupations`
  );
}

// ── Wage & Employment Data ─────────────────────────────────────────────────────

export interface WageData {
  occupation: { code: string; title: string };
  wage: Array<{
    scale: { id: string; name: string };
    annual?: number;
    hourly?: number;
  }>;
}

export async function getWageData(occupationCode: string): Promise<WageData> {
  return onetFetch<WageData>(`/occupations/${encodeURIComponent(occupationCode)}/summary/wages`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the top N elements by importance score from a domain.
 * Filters out elements with very low importance (< 2.0 on O*NET 1-5 scale).
 */
export function getTopElements(data: OnetDomainData, n = 15) {
  return (data.element ?? [])
    .filter((el) => (el.score?.value ?? 0) >= 2.0)
    .sort((a, b) => (b.score?.value ?? 0) - (a.score?.value ?? 0))
    .slice(0, n);
}
