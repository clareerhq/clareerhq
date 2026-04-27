// GET /api/onet/test — diagnostic endpoint to verify O*NET credentials in production
// DELETE THIS FILE once credentials are confirmed working

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const combined = process.env.ONET_API_KEY;
  const username = process.env.ONET_USERNAME;
  const password = process.env.ONET_PASSWORD;

  // Report which credential path will be used (without exposing values)
  let authMode: string;
  let authHeader: string;

  if (combined && combined.includes(':')) {
    authMode = 'ONET_API_KEY (combined)';
    authHeader = `Basic ${Buffer.from(combined).toString('base64')}`;
  } else if (username && password) {
    authMode = 'ONET_USERNAME + ONET_PASSWORD (separate)';
    authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  } else {
    return NextResponse.json({
      ok: false,
      authMode: 'MISSING — no credentials found in environment',
      envVarsPresent: {
        ONET_API_KEY: !!combined,
        ONET_USERNAME: !!username,
        ONET_PASSWORD: !!password,
      },
    }, { status: 500 });
  }

  // Make a real call to O*NET to verify credentials work
  const testUrl = 'https://services.onetcenter.org/ws/mnm/search?keyword=manager&start=1&end=3';
  let onetStatus: number;
  let onetBody: string;

  try {
    const res = await fetch(testUrl, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
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
    authMode,
    envVarsPresent: {
      ONET_API_KEY: !!combined,
      ONET_USERNAME: !!username,
      ONET_PASSWORD: !!password,
    },
    onetStatus,
    onetBody,
  });
}
