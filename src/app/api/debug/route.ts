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

  // Diagnose problem occupations — find what codes the search returns
  const acctSearch = await testEndpoint(`${BASE}/mnm/search?keyword=accountant&end=3`, apiKey);
  const dsSearch   = await testEndpoint(`${BASE}/mnm/search?keyword=data+scientist&end=3`, apiKey);

  // Extract first code from each search to test details/domain endpoints
  const acctCode = ((acctSearch.body as Record<string,unknown>)?.career as Array<{code:string}>)?.[0]?.code;
  const dsCode   = ((dsSearch.body as Record<string,unknown>)?.career as Array<{code:string}>)?.[0]?.code;

  const acctMnmDetails  = acctCode ? await testEndpoint(`${BASE}/mnm/careers/${acctCode}/`, apiKey) : null;
  const acctOnlineDetails = acctCode ? await testEndpoint(`${BASE}/online/occupations/${acctCode}/`, apiKey) : null;
  const acctSkills      = acctCode ? await testEndpoint(`${BASE}/online/occupations/${acctCode}/summary/skills?start=1&end=50`, apiKey) : null;
  const acctKnowledge   = acctCode ? await testEndpoint(`${BASE}/online/occupations/${acctCode}/summary/knowledge?start=1&end=50`, apiKey) : null;
  const acctWorkStyles  = acctCode ? await testEndpoint(`${BASE}/online/occupations/${acctCode}/summary/work_styles?start=1&end=50`, apiKey) : null;

  const dsMnmDetails    = dsCode ? await testEndpoint(`${BASE}/mnm/careers/${dsCode}/`, apiKey) : null;
  const dsSkills        = dsCode ? await testEndpoint(`${BASE}/online/occupations/${dsCode}/summary/skills?start=1&end=50`, apiKey) : null;
  const dsKnowledge     = dsCode ? await testEndpoint(`${BASE}/online/occupations/${dsCode}/summary/knowledge?start=1&end=50`, apiKey) : null;

  return NextResponse.json({
    accountant: {
      searchCode: acctCode,
      mnmDetails:    { status: acctMnmDetails?.status, ok: acctMnmDetails?.ok },
      onlineDetails: { status: acctOnlineDetails?.status, ok: acctOnlineDetails?.ok },
      skills:        { status: acctSkills?.status,     ok: acctSkills?.ok,     count: ((acctSkills?.body as Record<string,unknown>)?.element as unknown[])?.length },
      knowledge:     { status: acctKnowledge?.status,  ok: acctKnowledge?.ok,  count: ((acctKnowledge?.body as Record<string,unknown>)?.element as unknown[])?.length },
      workStyles:    { status: acctWorkStyles?.status, ok: acctWorkStyles?.ok, count: ((acctWorkStyles?.body as Record<string,unknown>)?.element as unknown[])?.length },
    },
    dataScientist: {
      searchCode: dsCode,
      mnmDetails:   { status: dsMnmDetails?.status, ok: dsMnmDetails?.ok },
      onlineSkills: { status: dsSkills?.status,    ok: dsSkills?.ok,    count: ((dsSkills?.body as Record<string,unknown>)?.element as unknown[])?.length },
      onlineKnow:   { status: dsKnowledge?.status, ok: dsKnowledge?.ok, count: ((dsKnowledge?.body as Record<string,unknown>)?.element as unknown[])?.length },
      mnmSkillsRaw: dsCode ? await testEndpoint(`${BASE}/mnm/careers/${dsCode}/skills`, apiKey).then(r => ({ status: r.status, ok: r.ok, raw: JSON.stringify(r.body).slice(0, 400) })) : null,
      mnmKnowRaw:   dsCode ? await testEndpoint(`${BASE}/mnm/careers/${dsCode}/knowledge`, apiKey).then(r => ({ status: r.status, ok: r.ok, raw: JSON.stringify(r.body).slice(0, 200) })) : null,
    },
  });
}
