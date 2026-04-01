// POST /api/alternatives
// Given a user's assessment ratings and the origin occupation code, returns
// up to 5 related occupations with their fit scores — ranked by best match.
//
// Body: { occupationCode: string; ratings: DomainRatings[] }
// Response: { alternatives: Array<{ code: string; title: string; fitScore: number }> }

import { NextRequest, NextResponse } from 'next/server';
import { getRelatedOccupations, getDomainData, getTopElements } from '@/lib/onet';
import { computeFitScore } from '@/lib/scoring';
import type { DomainRatings, AssessmentDomain } from '@/types/onet';
import type { UserRating } from '@/types/onet';

export const runtime = 'nodejs';

const DOMAINS: AssessmentDomain[] = ['skills', 'knowledge', 'work_styles'];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.occupationCode || !Array.isArray(body?.ratings)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { occupationCode, ratings } = body as {
    occupationCode: string;
    ratings: DomainRatings[];
  };

  // 1. Fetch related occupations from O*NET
  let related: Array<{ code: string; title: string }> = [];
  try {
    const res = await getRelatedOccupations(occupationCode);
    related = res.occupation.slice(0, 8); // cap at 8 to keep latency reasonable
  } catch {
    return NextResponse.json({ alternatives: [] });
  }

  // Build a lookup of the user's ratings keyed by elementId for fast scoring
  const userRatingsByElement: Record<string, UserRating> = {};
  for (const dr of ratings) {
    for (const el of dr.elements) {
      userRatingsByElement[el.elementId] = el.rating;
    }
  }

  // 2. Score each related occupation by re-using the user's existing ratings
  //    against the related occupation's own element requirements.
  const scored = await Promise.allSettled(
    related.map(async (occ) => {
      // Fetch this occupation's domain requirements
      const domainResults = await Promise.allSettled(
        DOMAINS.map((domain) => getDomainData(occ.code, domain))
      );

      // Build synthetic DomainRatings[] using user's original ratings
      // Any element not rated by the user defaults to 0 (None)
      const altRatings: DomainRatings[] = DOMAINS.map((domain, i) => {
        const result = domainResults[i];
        const elements =
          result.status === 'fulfilled'
            ? getTopElements(result.value, 15)
            : [];

        return {
          domain,
          elements: elements.map((el) => ({
            elementId: el.id,
            elementName: el.name,
            rating: (userRatingsByElement[el.id] ?? 0) as UserRating,
            onetImportance: el.score?.value ?? 3,
            onetLevel: el.score?.level ?? 4,
          })),
        };
      }).filter((dr) => dr.elements.length > 0);

      const result = computeFitScore(altRatings, occ.code, occ.title);
      return { code: occ.code, title: occ.title, fitScore: result.fitScore };
    })
  );

  const alternatives = scored
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<{ code: string; title: string; fitScore: number }>).value)
    .filter((r) => r.code !== occupationCode) // exclude the current occupation
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 5);

  return NextResponse.json({ alternatives });
}
