'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Star, RotateCcw, Loader2, ChevronDown } from 'lucide-react';
import { computeFitScore, getFitLabel, getFitColor } from '@/lib/scoring';
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

// ── Waitlist CTA ──────────────────────────────────────────────────────────────

function WaitlistCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'results_page' }),
      });
    } finally {
      setStatus('done');
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center py-4 text-accent-600 font-semibold">
        ✓ You're on the list! We'll notify you when Pro launches.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com" required
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
      <button
        type="submit" disabled={status === 'loading'}
        className="px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? '…' : 'Notify me'}
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
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
        <a href="/" className="text-lg font-bold text-brand-700">
          Clareer<span className="text-accent-600">HQ</span>
        </a>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-gray-400">Saving…</span>}
          <button
            onClick={() => router.push('/assess')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try another career
          </button>
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
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-gray-900">Skill Gaps</h3>
            </div>
            {result.gaps.length === 0 ? (
              <p className="text-sm text-accent-600 font-medium">No significant gaps — you're well-matched!</p>
            ) : (
              <ul className="space-y-2">
                {result.gaps.map((g) => (
                  <li key={g.elementId} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{g.elementName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pro upsell */}
        <div className="bg-brand-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-200 mb-1">
                Coming Soon — Pro
              </div>
              <h3 className="text-lg font-bold mb-1">Get the full picture</h3>
              <p className="text-brand-200 text-sm">
                Full 8-domain assessment, alternative career recommendations, printable career report, and comparison across multiple occupations.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <WaitlistCTA />
          </div>
        </div>

        {/* Try another */}
        <div className="text-center">
          <button
            onClick={() => router.push('/assess')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-brand-300 hover:text-brand-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Explore another career
          </button>
        </div>
      </div>
    </div>
  );
}
