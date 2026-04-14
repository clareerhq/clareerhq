'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Printer, ArrowLeft, Lock } from 'lucide-react';
import { computeFitScore } from '@/lib/scoring';
import type { AssessmentResult, DomainRatings } from '@/types/onet';
import { DOMAIN_LABELS } from '@/types/onet';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFitLabel(score: number) {
  if (score >= 0.80) return 'Excellent Match';
  if (score >= 0.65) return 'Strong Match';
  if (score >= 0.50) return 'Moderate Match';
  if (score >= 0.35) return 'Developing Match';
  return 'Early Stage';
}

function today() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState<boolean | null>(null);

  useEffect(() => {
    // Load assessment data from session
    const raw = sessionStorage.getItem('chq_results_payload');
    if (!raw) {
      router.push('/assess');
      return;
    }
    const payload = JSON.parse(raw) as {
      occupationCode: string;
      occupationTitle: string;
      ratings: DomainRatings[];
    };
    const computed = computeFitScore(
      payload.ratings,
      payload.occupationCode,
      payload.occupationTitle
    );
    setResult(computed);

    // Check purchase status
    fetch('/api/user/status')
      .then((r) => r.json())
      .then((data) => setPurchased(data.reportPurchased === true))
      .catch(() => setPurchased(false))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Not purchased — show upgrade wall
  if (!purchased) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-brand-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Skill-Print Report is a Pro feature
          </h1>
          <p className="text-gray-500 mb-8">
            Get your full, printable Skill-Print report for a one-time $10 — a professional PDF you can attach to any application.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/upgrade"
              className="block py-3.5 px-6 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
            >
              Unlock for $10 →
            </Link>
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to results
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fitPct = Math.round(result.fitScore * 100);
  const fitLabel = getFitLabel(result.fitScore);
  const domainEntries = Object.entries(result.domainScores);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .report-page { box-shadow: none !important; border: none !important; }
        }
        @page {
          size: letter portrait;
          margin: 0.6in 0.75in;
        }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to results
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Save as PDF
        </button>
      </div>

      {/* Report — this is what gets printed */}
      <div className="min-h-screen bg-gray-100 py-10 px-6 no-print-bg">
        <div
          className="report-page max-w-[680px] mx-auto bg-white shadow-xl rounded-2xl overflow-hidden"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {/* Header bar */}
          <div style={{ backgroundColor: '#0A4F4F', padding: '24px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: '800', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em' }}>
                  CLAREERHQ
                </div>
                <div style={{ color: '#7BBFBF', fontSize: '11px', fontFamily: 'system-ui, sans-serif', marginTop: '2px' }}>
                  Your HQ for career clarity
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#7BBFBF', fontSize: '10px', fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Generated
                </div>
                <div style={{ color: '#fff', fontSize: '11px', fontFamily: 'system-ui, sans-serif', marginTop: '2px' }}>
                  {today()}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '36px 40px' }}>

            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                backgroundColor: '#0A4F4F', color: '#fff',
                fontSize: '9px', fontWeight: '800',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: '99px',
              }}>
                Skill-Print
              </div>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E6F3F3' }} />
            </div>

            {/* Role title */}
            <h1 style={{
              fontSize: '26px', fontWeight: '700', color: '#111',
              marginBottom: '4px', fontFamily: 'system-ui, sans-serif',
            }}>
              {result.occupationTitle}
            </h1>
            <div style={{ color: '#666', fontSize: '13px', fontFamily: 'system-ui, sans-serif', marginBottom: '28px' }}>
              Based on O*NET occupational data — U.S. Department of Labor
            </div>

            {/* Score row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '24px',
              backgroundColor: '#E6F3F3', borderRadius: '12px',
              padding: '20px 24px', marginBottom: '28px',
            }}>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '48px', fontWeight: '900', color: '#0A4F4F', lineHeight: 1, fontFamily: 'system-ui, sans-serif' }}>
                  {fitPct}
                </div>
                <div style={{ fontSize: '11px', color: '#2A8B8B', fontFamily: 'system-ui, sans-serif', fontWeight: '600' }}>/ 100</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0A4F4F', fontFamily: 'system-ui, sans-serif', marginBottom: '4px' }}>
                  {fitLabel}
                </div>
                <div style={{ fontSize: '13px', color: '#555', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
                  Your skill-print matches <strong>{fitPct}%</strong> of what <strong>{result.occupationTitle}</strong> roles typically require, weighted by each skill's importance to the role.
                </div>
              </div>
            </div>

            {/* Domain breakdown */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#0A4F4F', fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
                Domain Breakdown
              </div>
              {domainEntries.map(([domain, score]) => {
                const pct = Math.round((score as number) * 100);
                return (
                  <div key={domain} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#333', fontFamily: 'system-ui, sans-serif', fontWeight: '500' }}>
                        {DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS] ?? domain}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A4F4F', fontFamily: 'system-ui, sans-serif' }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#E6F3F3', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '8px', width: `${pct}%`, backgroundColor: pct >= 70 ? '#2A8B8B' : pct >= 50 ? '#0A4F4F' : '#f59e0b', borderRadius: '99px' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Strengths + Gaps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>

              {/* Strengths */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0A4F4F', fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                  ✦ Top Strengths
                </div>
                {result.strengths.slice(0, 6).map((s) => (
                  <div key={s.elementId} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2A8B8B', marginTop: '5px', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#333', fontFamily: 'system-ui, sans-serif', lineHeight: 1.4 }}>
                      {s.elementName}
                    </span>
                  </div>
                ))}
                {result.strengths.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#999', fontFamily: 'system-ui, sans-serif' }}>No rated strengths yet.</div>
                )}
              </div>

              {/* Gaps */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0A4F4F', fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                  △ Growth Areas
                </div>
                {result.gaps.slice(0, 6).map((g) => (
                  <div key={g.elementId} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', marginTop: '5px', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#333', fontFamily: 'system-ui, sans-serif', lineHeight: 1.4 }}>
                      {g.elementName}
                    </span>
                  </div>
                ))}
                {result.gaps.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#2A8B8B', fontFamily: 'system-ui, sans-serif', fontWeight: '600' }}>No significant gaps — well matched!</div>
                )}
              </div>
            </div>

            {/* Resume callout */}
            <div style={{
              border: '1.5px dashed #2A8B8B', borderRadius: '10px',
              padding: '14px 18px', marginBottom: '28px',
              backgroundColor: '#f7fefe',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#0A4F4F', fontFamily: 'system-ui, sans-serif', marginBottom: '4px' }}>
                HOW TO USE THIS SECTION ON YOUR RESUME
              </div>
              <div style={{ fontSize: '12px', color: '#444', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
                Add a <strong>Skill-Print</strong> section directly below your Summary — before Experience. List your target role, overall score, and top domain scores. It signals to hiring managers that you understand exactly what the role requires and have assessed yourself honestly against it.
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #E6F3F3', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: '#999', fontFamily: 'system-ui, sans-serif' }}>
                Occupational data: O*NET Resource Center, U.S. Department of Labor
              </div>
              <div style={{ fontSize: '10px', color: '#2A8B8B', fontFamily: 'system-ui, sans-serif', fontWeight: '600' }}>
                clareerhq.com
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
