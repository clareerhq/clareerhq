// GET /api/onet/occupations?q=software+developer&start=1&end=20
// Proxies O*NET occupation search (keeps API credentials server-side)

import { NextRequest, NextResponse } from 'next/server';
import { searchOccupations } from '@/lib/onet';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const start = parseInt(searchParams.get('start') ?? '1');
  const end = parseInt(searchParams.get('end') ?? '20');

  if (!q.trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const data = await searchOccupations(q, start, end);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[onet/occupations]', err);
    return NextResponse.json(
      { error: 'Failed to search O*NET occupations' },
      { status: 500 }
    );
  }
}
