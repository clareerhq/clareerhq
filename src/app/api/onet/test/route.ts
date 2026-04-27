// GET /api/onet/test — diagnostic endpoint to verify O*NET credentials in production
// DELETE THIS FILE once credentials are confirmed working

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.ONET_API_KEY;

  if (!key) {
    return NextResponse.json({
      ok: false,
      error: 'ONET_API_KEY not found in environment',
    }, { status: 500 });
  }

  // Make a real call to O*NET v2 to verify credentials work
  const testUrl = 'https://api-v2.onetcenter.org/mnm/search?keyword=manager&start=1&end=3';
  let onetStatus: number;
  let onetBody: string;

  try {
    const res = await fetch(testUrl, {
      headers: { 'X-API-Key': key, 'Accept': 'application/json' },
      cache: 'no-store',
    });
    onetStatus = res.status;
    onetBody = onetStatus === 200 ? 'OK' : await res.text();
  } catch (e) {
    onetStatus = 0;
    onetBody = String(e);
  }

  return NextResponse.json({
    ok: onetStatus === 200,
    keyPresent: true,
    keyLength: key.length,
    onetStatus,
    onetBody,
  });
}
