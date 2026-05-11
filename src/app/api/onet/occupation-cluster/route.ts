// GET /api/onet/occupation-cluster?code=11-3121.00
// Returns the career cluster(s) for a given O*NET occupation code.

import { NextRequest, NextResponse } from 'next/server';
import { getOccupationClusters } from '@/lib/onet';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Query parameter "code" is required' }, { status: 400 });
  }

  try {
    const data = await getOccupationClusters(decodeURIComponent(code));
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[onet/occupation-cluster]', err);
    return NextResponse.json(
      { error: 'Failed to fetch cluster for occupation' },
      { status: 500 }
    );
  }
}
