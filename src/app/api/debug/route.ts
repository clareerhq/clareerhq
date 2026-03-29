// GET /api/debug — tests O*NET connectivity and shows exact auth status
// Visit clareerhq.com/api/debug to diagnose connection issues
// REMOVE THIS FILE before going to production!

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const apiKey = process.env.ONET_API_KEY;
  const username = process.env.ONET_USERNAME;
  const password = process.env.ONET_PASSWORD;

  const envStatus = {
    ONET_API_KEY: apiKey ? `✓ set (${apiKey.slice(0, 6)}...)` : '✗ not set',
    ONET_USERNAME: username ? `✓ set (${username.slice(0, 6)}...)` : '✗ not set',
    ONET_PASSWORD: password ? `✓ set (${password.slice(0, 6)}...)` : '✗ not set',
  };

  // Build auth header — try ONET_API_KEY first, fall back to USERNAME:PASSWORD
  let authHeader: string;
  let authMethod: string;
  if (apiKey) {
    authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
    authMethod = 'ONET_API_KEY as username (blank password)';
  } else if (username && password) {
    authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    authMethod = 'ONET_USERNAME:ONET_PASSWORD';
  } else {
    return NextResponse.json({
      error: 'No O*NET credentials found in environment variables.',
      envStatus,
    }, { status: 500 });
  }

  // Test the O*NET API
  let onetStatus: number | null = null;
  let onetBody: string | null = null;
  let onetError: string | null = null;

  try {
    const res = await fetch(
      'https://services.onetcenter.org/ws/search?keyword=marketing&end=3',
      {
        headers: {
          Authorization: authHeader,
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
      : `❌ O*NET returned ${onetStatus}. Check credentials below.`,
    fix: success ? null : {
      if_401: 'Auth failed. Your credentials are wrong or not yet approved by O*NET.',
      if_403: 'Forbidden. Your O*NET account may not be activated yet.',
      steps: [
        '1. Log in to https://services.onetcenter.org/developer/',
        '2. Find your USERNAME and PASSWORD (separate from API key)',
        '3. In Vercel: add ONET_USERNAME and ONET_PASSWORD with those values',
        '4. Remove ONET_API_KEY from Vercel (or keep it if format is correct)',
        '5. Redeploy and visit this page again',
      ],
    },
  });
}
