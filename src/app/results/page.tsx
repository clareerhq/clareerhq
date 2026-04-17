'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, Star, RotateCcw, Loader2, ChevronDown, TrendingUp, FileDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { computeFitScore, getFitLabel, getFitColor } from '@/lib/scoring';
import { track } from '@/lib/posthog';
import type { AssessmentResult, DomainRatings } from '@/types/onet';
import { DOMAIN_LABELS } from '@/types/onet';
import { formatScore } from '@/lib/utils';

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(pct), 100);
    return () => clearTimeout(timeout);
  }, [pct]);

  const dashOffset = circumference - (animated / 100) * circumference;
  const color = score >= 0.70 ? '#148F77' : score >= 0.50 ? '#1B4F72' : score >= 0.35 ? '#f59e0b' : '#9ca3af';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-black" style={{ color }}>{animated}</div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">/ 100</div>
      </div>
    </div>
  );
}

// ── Domain bar ────────────────────────────────────────────────────────────────

function DomainBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  const color = score >= 0.70 ? 'bg-accent-500' : score >= 0.50 ? 'bg-brand-600' : score >= 0.35 ? 'bg-amber-400' : 'bg-gray-300';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500 font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ── Upgrade CTA ───────────────────────────────────────────────────────────────

function UpgradeCTA() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        href="/upgrade"
        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-accent-500 text-white font-bold text-sm hover:bg-accent-600 transition-colors"
      >
        See upgrade options
      </Link>
      <Link
        href="/upgrade"
        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors border border-white/20"
      >
        $10/mo — unlimited job specs
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface AlternativeOccupation {
  code: string;
  title: string;
  fitScore: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);
  const [alternatives, setAlternatives] = useState<AlternativeOccupation[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [showAlts, setShowAlts] = useState(false);
  const [reportPurchased, setReportPurchased] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('chq_results_payload')
      ?? localStorage.getItem('chq_results_payload_backup');
    if (!raw) {
      router.push('/assess');
      return;
    }
    sessionStorage.setItem('chq_results_payload', raw);

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
    track('assessment_completed', {
      occupation_code: payload.occupationCode,
      occupation_title: payload.occupationTitle,
      fit_score: Math.round(computed.fitScore * 100),
    });

    // Save to DB if logged in (non-blocking)
    if (!savedRef.current) {
      savedRef.current = true;
      setSaving(true);
      fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .catch(() => {}) // Silent fail — user can still see results
        .finally(() => setSaving(false));

      // Check purchase status
      fetch('/api/user/status')
        .then((r) => r.json())
        .then((d) => setReportPurchased(d.reportPurchased === true))
        .catch(() => {});

      // Fetch alternative career recommendations in the background
      setLoadingAlts(true);
      fetch('/api/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupationCode: payload.occupationCode,
          ratings: payload.ratings,
        }),
      })
        .then((r) => r.json())
        .then((data) => setAlternatives(data.alternatives ?? []))
        .catch(() => {})
        .finally(() => setLoadingAlts(false));
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const fitPct = Math.round(result.fitScore * 100);
  const fitLabel = getFitLabel(result.fitScore);
  const fitColor = getFitColor(result.fitScore);
  const domainEntries = Object.entries(result.domainScores);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <a href="/">
          <img src="/logo.svg" alt="ClareerHQ" className="h-6 w-auto" />
        </a>
        <div className="flex items-center gap-4">
          {saving && <span className="text-xs text-gray-400">Saving…</span>}
          <button
            onClick={() => router.push('/assess')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try another
          </button>
          {isSignedIn && (
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
          <div className="text-sm text-gray-500 mb-1">Your fit for</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
            {result.occupationTitle}
          </h1>
          <ScoreRing score={result.fitScore} />
          <div className={`text-xl font-bold mt-3 ${fitColor}`}>{fitLabel}</div>
          <p className="text-gray-500 text-sm mt-2">
            Your profile matches <strong>{fitPct}%</strong> of what this role typically requires.
          </p>
        </div>

        {/* Skill-Print Report — free, requires sign-in */}
        <div className="mb-6">
          <Link
            href="/report"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
          >
            <FileDown className="w-5 h-5" />
            View & Download Your Skill-Print Report — Free
          </Link>
        </div>

        {/* Domain breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Domain Breakdown</h2>
          {domainEntries.map(([domain, score]) => (
            <DomainBar
              key={domain}
              label={DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS] ?? domain}
              score={score}
            />
          ))}
        </div>

        {/* Strengths + Gaps */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-accent-600" />
              <h3 className="font-bold text-gray-900">Your Strengths</h3>
            </div>
            {result.strengths.length === 0 ? (
              <p className="text-sm text-gray-400">Complete more ratings to see your strengths.</p>
            ) : (
              <ul className="space-y-2">
                {result.strengths.map((s) => (
                  <li key={s.elementId} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{s.elementName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Gaps */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <h3 className="font-bold text-gray-900">Growth Areas</h3>
            </div>
            {result.gaps.length === 0 ? (
              <p className="text-sm text-accent-600 font-medium">No significant gaps — you're well-matched!</p>
            ) : (
              <ul className="space-y-2">
                {result.gaps.map((g) => (
                  <li key={g.elementId} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{g.elementName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pro upsell */}
        <div className="bg-brand-700 rounded-2xl p-6 text-white mb-6">
          <h3 className="text-lg font-bold mb-4">Go deeper with your Skill-Print</h3>

          {/* $10 one-time */}
          <div className="mb-4 p-3 rounded-xl bg-white/10 border border-white/20">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-xl font-extrabold text-accent-300">$10</span>
              <span className="text-xs text-brand-200 font-semibold uppercase tracking-wide">one-time</span>
            </div>
            <p className="text-sm text-brand-100">
              <strong className="text-white">Full 8-domain Skill-Print.</strong> Unlock all 8 O*NET dimensions — Skills, Knowledge, Work Styles, Abilities, Work Activities, Work Context, Interests, and Job Zone — for a complete picture of your fit.
            </p>
          </div>

          {/* $10/mo */}
          <div className="p-3 rounded-xl bg-white/10 border border-white/20">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-xl font-extrabold text-accent-300">$10</span>
              <span className="text-xs text-brand-200 font-semibold uppercase tracking-wide">/ month</span>
            </div>
            <ul className="space-y-1.5 text-sm text-brand-100">
              {[
                ['Everything in the 8-domain report, plus:', ''],
                ['Job spec engine.', 'Paste any job posting — we gap-analyze it against your Skill-Print.'],
                ['Resume section generator.', 'Auto-generate an evidence-based Skill-Print block tailored to the specific role.'],
                ['Unlimited comparisons', '+ first access to every new feature.'],
              ].map(([bold, rest], i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent-400 font-bold flex-shrink-0">→</span>
                  <span><strong className="text-white">{bold}</strong>{rest ? ` ${rest}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <UpgradeCTA />
          </div>
        </div>

        {/* Try another */}
        <div className="text-center mb-6">
          <button
            onClick={() => router.push('/assess')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-brand-300 hover:text-brand-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try a different role
          </button>
        </div>

        {/* Related roles — secondary / opt-in explore section */}
        {(loadingAlts || alternatives.length > 0) && (
          <div className="border border-gray-100 rounded-2xl overflow-hidden mb-8">
            <button
              onClick={() => setShowAlts((v) => !v)}
              className="w-full flex items-center justify-between gap-3 p-4 bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-600">
                  Explore related roles
                </span>
                {loadingAlts && (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                )}
                {!loadingAlts && alternatives.length > 0 && (
                  <span className="text-xs text-gray-400">({alternatives.length} roles)</span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showAlts ? 'rotate-180' : ''}`}
              />
            </button>

            {showAlts && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {alternatives.map((alt) => {
                  const pct = Math.round(alt.fitScore * 100);
                  const color =
                    alt.fitScore >= 0.70 ? 'bg-accent-500' :
                    alt.fitScore >= 0.55 ? 'bg-brand-600' : 'bg-amber-400';
                  return (
                    <button
                      key={alt.code}
                      onClick={() => {
                        sessionStorage.setItem('chq_occupation', JSON.stringify({ code: alt.code, title: alt.title }));
                        router.push('/assess/domains');
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 bg-white hover:bg-brand-50 transition-colors group text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 group-hover:text-brand-700 truncate">
                          {alt.title}
                        </div>
                        <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-600">{pct}%</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
