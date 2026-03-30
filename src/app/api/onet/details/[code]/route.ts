// GET /api/onet/details/[code]?domains=skills,knowledge,abilities
// Returns occupation details + domain element data for assessment

import { NextRequest, NextResponse } from 'next/server';
import { getOccupationDetails, getDomainData, getTopElements } from '@/lib/onet';
import type { AssessmentDomain } from '@/types/onet';

export const runtime = 'nodejs';

const DEFAULT_DOMAINS: AssessmentDomain[] = ['skills', 'knowledge', 'work_styles'];

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = decodeURIComponent(params.code);
  const { searchParams } = new URL(req.url);
  const domainsParam = searchParams.get('domains');

  const requestedDomains: AssessmentDomain[] = domainsParam
    ? (domainsParam.split(',') as AssessmentDomain[])
    : DEFAULT_DOMAINS;

  // Use allSettled so a single failing domain doesn't crash the whole page
  const [detailsResult, ...domainResults] = await Promise.allSettled([
    getOccupationDetails(code),
    ...requestedDomains.map((d) => getDomainData(code, d)),
  ]);

  if (detailsResult.status === 'rejected') {
    console.error('[onet/details] occupation lookup failed:', detailsResult.reason);
    return NextResponse.json(
      { error: 'Occupation not found in O*NET database.' },
      { status: 404 }
    );
  }

  // Build domain data — failed domains return empty array rather than crashing
  const domains = requestedDomains.reduce<Record<string, unknown>>((acc, domain, i) => {
    const result = domainResults[i];
    if (result.status === 'fulfilled') {
      acc[domain] = getTopElements(result.value, 15);
    } else {
      console.warn(`[onet/details] domain "${domain}" failed for ${code}:`, result.reason);
      acc[domain] = [];
    }
    return acc;
  }, {});

  return NextResponse.json({ details: detailsResult.value, domains });
}
