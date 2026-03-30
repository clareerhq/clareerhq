// GET /api/debug — tests O*NET connectivity and shows exact auth status
// Visit clareerhq.com/api/debug to diagnose connection issues
// REMOVE THIS FILE before going to production!

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const apiKey = process.env.ONET_API_KEY;

  const envStatus = {
    ONET_API_KEY: apiKey ? `✓ set (${apiKey.slice(0, 6)}...)` : '✗ not set',
  };

  if (!apiKey) {
    return NextResponse.json({
      error: 'ONET_API_KEY not found in environment variables.',
      envStatus,
    }, { status: 500 });
  }

  const authMethod = 'X-API-Key header (O*NET API v2)';

  // Test the O*NET API v2
  let onetStatus: number | null = null;
  let onetBody: string | null = null;
  let onetError: string | null = null;

  try {
    const res = await fetch(
      'https://api-v2.onetcenter.org/occupations?keyword=marketing&end=3',
      {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );
    onetStatus = res.status;
    onetBody = await res.text();
  } catch (err) {
    onetError = String(err);
  }

  const success = onetStatus === 200;

  return NextResponse.json({
    success,
    authMethod,
    envStatus,
    onetStatus,
    onetBody: onetBody ? onetBody.slice(0, 500) : null,
    onetError,
    message: success
      ? '✅ O*NET connection working! Search is ready.'
      : `❌ O*NET returned ${onetStatus}.`,
  });
}
