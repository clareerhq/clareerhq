// GET /api/debug — tests O*NET v2 connectivity across all key endpoints
// Visit clareerhq.com/api/debug to diagnose connection issues
// REMOVE THIS FILE before going to production!

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function testEndpoint(url: string, apiKey: string) {
  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
      cache: 'no-store',
    });
    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    return { status: res.status, ok: res.ok, body };
  } catch (err) {
    return { status: null, ok: false, body: null, error: String(err) };
  }
}

export async function GET() {
  const apiKey = process.env.ONET_API_KEY;

  const envStatus = {
    ONET_API_KEY: apiKey ? `✓ set (${apiKey.slice(0, 6)}...)` : '✗ not set',
  };

  if (!apiKey) {
    return NextResponse.json({ error: 'ONET_API_KEY not set', envStatus }, { status: 500 });
  }

  const BASE = 'https://api-v2.onetcenter.org';

  // Test 1: keyword search
  const search = await testEndpoint(`${BASE}/mnm/search?keyword=marketing&end=3`, apiKey);

  // Test 2: career details for a known occupation (Marketing Managers)
  const details = await testEndpoint(`${BASE}/mnm/careers/11-2021.00/`, apiKey);

  // Test online API endpoints (these have full scored data needed for assessment)
  const onlineSkills   = await testEndpoint(`${BASE}/online/occupations/11-2021.00/summary/skills`, apiKey);
  const onlineKnow     = await testEndpoint(`${BASE}/online/occupations/11-2021.00/summary/knowledge`, apiKey);
  const onlineStyles   = await testEndpoint(`${BASE}/online/occupations/11-2021.00/summary/work_styles`, apiKey);

  const allOk = search.ok && details.ok && onlineSkills.ok;

  return NextResponse.json({
    success: allOk,
    message: allOk
      ? '✅ All O*NET endpoints working!'
      : '❌ One or more endpoints failed — see results below.',
    envStatus,
    results: {
      search:         { url: '/mnm/search?keyword=marketing&end=3', status: search.status, ok: search.ok },
      details:        { url: '/mnm/careers/11-2021.00/', status: details.status, ok: details.ok },
      onlineSkills:   { url: '/online/occupations/11-2021.00/summary/skills', status: onlineSkills.status, ok: onlineSkills.ok, raw: onlineSkills.ok ? JSON.stringify(onlineSkills.body).slice(0, 600) : onlineSkills.body },
      onlineKnow:     { url: '/online/occupations/11-2021.00/summary/knowledge', status: onlineKnow.status, ok: onlineKnow.ok },
      onlineStyles:   { url: '/online/occupations/11-2021.00/summary/work_styles', status: onlineStyles.status, ok: onlineStyles.ok },
    },
  });
}
