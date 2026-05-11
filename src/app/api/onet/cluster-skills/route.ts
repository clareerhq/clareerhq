// GET /api/onet/cluster-skills?cluster=04
// Aggregates skills across all occupations in a career cluster.
// Samples up to MAX_OCCUPATIONS occupations, fetches 5 domains in parallel,
// and returns a unified element list per domain sorted by mean importance.

import { NextRequest, NextResponse } from 'next/server';
import { getOccupationsByCluster, getDomainData } from '@/lib/onet';
import type { AssessmentDomain } from '@/types/onet';

export const runtime = 'nodejs';

// The 5 domains shown on a Skill-Print
const CLUSTER_DOMAINS: AssessmentDomain[] = [
  'skills',
  'knowledge',
  'abilities',
  'work_activities',
  'technology_skills',
];

const DOMAIN_LABELS: Record<AssessmentDomain, string> = {
  skills: 'Skills',
  knowledge: 'Knowledge',
  abilities: 'Abilities',
  work_styles: 'Work Styles',
  interests: 'Interests',
  work_activities: 'Work Activities',
  work_context: 'Work Context',
  technology_skills: 'Technology Tools',
};

// Sample at most this many occupations to keep the API fast on first load.
// O*NET revalidates at 1 hour so subsequent hits are instant.
const MAX_OCCUPATIONS = 15;

export interface ClusterSkillElement {
  id: string;
  name: string;
  avgImportance: number; // mean importance across occupations that have this element (1–5)
  avgLevel: number;      // mean level across occupations that have this element (1–7)
  occupationCount: number; // how many sampled occupations include this element
}

export interface ClusterDomain {
  domain: AssessmentDomain;
  label: string;
  elements: ClusterSkillElement[];
}

export interface ClusterSkillsResponse {
  clusterCode: string;
  clusterTitle: string;
  totalOccupations: number;
  sampledOccupations: number;
  domains: ClusterDomain[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clusterCode = searchParams.get('cluster');

  if (!clusterCode) {
    return NextResponse.json({ error: 'Query parameter "cluster" is required' }, { status: 400 });
  }

  try {
    // 1. Fetch occupations in this cluster
    const clusterData = await getOccupationsByCluster(clusterCode, 1, 100);
    const allOccupations = clusterData.occupation ?? [];

    // Sample a representative subset if the cluster is large
    const sampled = allOccupations.slice(0, MAX_OCCUPATIONS);

    if (sampled.length === 0) {
      return NextResponse.json({ error: 'No occupations found for this cluster' }, { status: 404 });
    }

    // 2. For each sampled occupation, fetch all 5 domains in parallel
    const occupationDomainData = await Promise.all(
      sampled.map(async (occ) => {
        const domainResults = await Promise.allSettled(
          CLUSTER_DOMAINS.map((domain) => getDomainData(occ.code, domain))
        );
        return { code: occ.code, title: occ.title, domainResults };
      })
    );

    // 3. Aggregate: for each domain, build a map of elementId → accumulator
    type ElementAccum = {
      name: string;
      importanceSum: number;
      levelSum: number;
      count: number;
    };

    const domainMaps: Record<string, Map<string, ElementAccum>> = {};
    for (const domain of CLUSTER_DOMAINS) {
      domainMaps[domain] = new Map();
    }

    for (const { domainResults } of occupationDomainData) {
      domainResults.forEach((result, i) => {
        if (result.status !== 'fulfilled') return;
        const domain = CLUSTER_DOMAINS[i];
        const map = domainMaps[domain];
        const elements = result.value.element ?? [];

        for (const el of elements) {
          // Use the "importance" score from O*NET (scale IM = importance 1-5)
          // The summary endpoint returns score.value which may represent importance or level
          // depending on the endpoint's primary scale. We also check for a level score.
          const importance = el.score?.value ?? 3;
          const level = el.score?.level ?? importance;

          const existing = map.get(el.id);
          if (existing) {
            existing.importanceSum += importance;
            existing.levelSum += level;
            existing.count += 1;
          } else {
            map.set(el.id, {
              name: el.name,
              importanceSum: importance,
              levelSum: level,
              count: 1,
            });
          }
        }
      });
    }

    // 4. Convert maps to sorted arrays
    const domains: ClusterDomain[] = CLUSTER_DOMAINS.map((domain) => {
      const map = domainMaps[domain];
      const elements: ClusterSkillElement[] = Array.from(map.entries())
        .map(([id, acc]) => ({
          id,
          name: acc.name,
          avgImportance: acc.importanceSum / acc.count,
          avgLevel: acc.levelSum / acc.count,
          occupationCount: acc.count,
        }))
        // Sort by average importance desc, then occupationCount desc (breadth)
        .sort((a, b) =>
          b.avgImportance !== a.avgImportance
            ? b.avgImportance - a.avgImportance
            : b.occupationCount - a.occupationCount
        );

      return { domain, label: DOMAIN_LABELS[domain], elements };
    });

    const response: ClusterSkillsResponse = {
      clusterCode,
      clusterTitle: clusterData.cluster?.title ?? '',
      totalOccupations: clusterData.total ?? allOccupations.length,
      sampledOccupations: sampled.length,
      domains,
    };

    return NextResponse.json(response, {
      headers: {
        // Cache at CDN edge for 1 hour — O*NET data doesn't change often
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[onet/cluster-skills]', err);
    return NextResponse.json(
      { error: 'Failed to aggregate cluster skills' },
      { status: 500 }
    );
  }
}
