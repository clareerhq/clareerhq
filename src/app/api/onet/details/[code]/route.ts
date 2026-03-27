// GET /api/onet/details/[code]?domains=skills,knowledge,abilities
// Returns occupation details + domain element data for assessment

import { NextRequest, NextResponse } from 'next/server';
import { getOccupationDetails, getDomainData, getTopElements } from '@/lib/onet';
import type { AssessmentDomain } from '@/types/onet';

export const runtime = 'nodejs';

const DEFAULT_DOMAINS: AssessmentDomain[] = ['skills', 'knowledge', 'work_styles'];
const ALL_DOMAINS: AssessmentDomain[] = [
  'skills', 'knowledge', 'abilities', 'work_styles',
  'work_activities', 'interests',
];

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

  try {
    // Fetch occupation details + all domain data in parallel
    const [details, ...domainResults] = await Promise.all([
      getOccupationDetails(code),
      ...requestedDomains.map((d) => getDomainData(code, d)),
    ]);

    // Build domain data with top N elements per domain
    const domains = requestedDomains.reduce<Record<string, unknown>>((acc, domain, i) => {
      acc[domain] = getTopElements(domainResults[i], 15);
      return acc;
    }, {});

    return NextResponse.json({ details, domains });
  } catch (err) {
    console.error('[onet/details]', err);
    return NextResponse.json(
      { error: 'Failed to fetch O*NET occupation data' },
      { status: 500 }
    );
  }
}
