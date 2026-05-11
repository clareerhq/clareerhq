'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { Download, LayoutDashboard, RotateCcw, Lock } from 'lucide-react';
import { track } from '@/lib/posthog';
import { computeSkillPrint } from '@/lib/scoring';
import type { PipValue, SkillPrintCategory } from '@/lib/scoring';
import type { DomainRatings } from '@/types/onet';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResultsPayload {
  occupationCode: string;
  occupationTitle: string;
  ratings: DomainRatings[];
}

// ── Pip display ───────────────────────────────────────────────────────────────

function Pips({ value, size = 'md' }: { value: PipValue; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return (
    <div className="flex gap-1 flex-shrink-0">
      {([1, 2, 3] as const).map((i) => (
        <div
          key={i}
          className={`${dim} rounded-full border-[1.5px] ${
            i <= value
              ? 'bg-[#1e3a5f] border-[#1e3a5f]'
              : 'bg-white border-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// ── Skill-Print card ──────────────────────────────────────────────────────────
// This is the printable artifact — kept self-contained so print CSS is clean.

function SkillPrintCard({
  occupationCode,
  occupationTitle,
  categories,
  displayName,
  dateStr,
}: {
  occupationCode: string;
  occupationTitle: string;
  categories: SkillPrintCategory[];
  displayName: string | null;
  dateStr: string;
}) {
  return (
    <div
      id="skillprint-card"
      className="bg-white rounded-xl border border-[#1e3a5f] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563a8] px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] tracking-[0.12em] uppercase text-white/50 font-bold mb-1.5">
            Skill-Print          </div>
          <div className="text-xl font-bold text-white leading-tight">
            {occupationTitle}
          </div>
          <div className="text-[10px] text-white/40 mt-1">
            O*NET-SOC {occupationCode}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[11px] font-extrabold text-white tracking-tight">
            Clareer<span className="text-blue-300">HQ</span>
          </div>
          {displayName && (
            <div className="text-[9px] text-white/45 mt-1">{displayName}</div>
          )}
          <div className="text-[9px] text-white/45 mt-0.5">{dateStr}</div>
        </div>
      </div>

      {/* Category rows */}
      <div className="px-5 py-4 flex flex-col gap-3.5">
        {categories.map(({ key, label, pip }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="text-[13px] font-semibold text-gray-700 flex-1">{label}</div>
            <Pips value={pip} />
          </div>
        ))}
      </div>

      {/* Legend / footer */}
      <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="text-[8px] text-gray-300 leading-relaxed">
          ● Beginner &nbsp;·&nbsp; ●● Intermediate &nbsp;·&nbsp; ●●● Advanced
          &nbsp;·&nbsp; Self-assessed &nbsp;·&nbsp; O*NET data, U.S. Dept. of Labor
        </div>
        <div className="text-[8px] font-bold text-[#2563a8] flex-shrink-0">
          getmyskillprint.com
        </div>
      </div>
    </div>
  );
}

// ── Cluster upgrade teaser ─────────────────────────────────────────────────────

function ClusterTeaser({ categories }: { categories: SkillPrintCategory[] }) {
  // Show a blurred/locked preview of what the full breakdown looks like
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <div className="text-center px-6">
          <div className="text-sm font-bold text-gray-900 mb-1">
            Full career cluster Skill-Print
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Rates every skill across all occupations in your cluster —
            a complete picture of your career identity, not just one job title.
          </div>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-bold hover:bg-[#162d4a] transition-colors"
          >
            Get the cluster Skill-Print — $10
          </Link>
        </div>
      </div>

      {/* Blurred preview underneath */}
      <div className="px-5 pt-4 pb-3 opacity-40 pointer-events-none select-none">
        <div className="text-[9px] tracking-widest uppercase text-gray-400 font-bold mb-1">
          Skill-Print · Career Cluster
        </div>
        <div className="text-base font-bold text-gray-800 mb-3">
          Management &amp; Entrepreneurship
        </div>
        {categories.map(({ key, label, pip }) => (
          <div key={key} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-600 flex-1">{label}</div>
              <Pips value={pip} size="sm" />
            </div>
            <div className="pl-2 flex flex-col gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2 bg-gray-200 rounded flex-1" style={{ width: `${60 + i * 10}%` }} />
                  <Pips value={Math.max(1, pip - i) as PipValue} size="sm" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [payload, setPayload] = useState<ResultsPayload | null>(null);

  useEffect(() => {
    const raw =
      sessionStorage.getItem('chq_results_payload') ??
      localStorage.getItem('chq_results_payload_backup');

    if (!raw) {
      router.push('/assess');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ResultsPayload;
      setPayload(parsed);
      track('skillprint_viewed', {
        occupation_code: parsed.occupationCode,
        occupation_title: parsed.occupationTitle,
      });
    } catch {
      router.push('/assess');
    }
  }, [router]);

  // Save assessment to DB (for dashboard tracking) — fire once when payload+auth are both ready.
  // Fire-and-forget: silently fails if unauthenticated or network error.
  useEffect(() => {
    if (!isSignedIn || !payload) return;
    // Use a flag stored in sessionStorage so we don't double-save on re-renders
    const saveKey = `chq_saved_${payload.occupationCode}_${Date.now().toString().slice(0, -3)}`;
    if (sessionStorage.getItem(saveKey)) return;
    sessionStorage.setItem(saveKey, '1');

    fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        occupationCode: payload.occupationCode,
        occupationTitle: payload.occupationTitle,
        ratings: payload.ratings,
      }),
    }).catch(() => {/* silent — dashboard works on next save */});
  }, [isSignedIn, payload]);

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { occupationCode, occupationTitle, ratings } = payload;
  const categories = computeSkillPrint(ratings);
  const displayName = user?.firstName
    ? user.firstName + (user.lastName ? ` ${user.lastName[0]}.` : '')
    : null;
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function handleDownload() {
    track('skillprint_download', { occupation_code: occupationCode });
    window.print();
  }

  return (
    <>
      {/* Print styles — hides everything except the card, scales to fit page */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
          #skillprint-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            border: 1.5px solid #1e3a5f !important;
            max-width: 6.5in;
            margin: 0.5in auto;
          }
        }
      `}</style>

      {/* Nav */}
      <nav className="no-print bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Link href="/">
          <img src="/logo.svg" alt="Skill-Print" className="h-7 w-auto" />
        </Link>
        {isSignedIn && (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        )}
      </nav>

      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-lg mx-auto flex flex-col gap-6">

          {/* Page heading */}
          <div className="no-print text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your Skill-Print is ready.
            </h1>
            <p className="text-gray-500 text-sm">
              Download and add it to your resume — it's yours, free.
            </p>
          </div>

          {/* The Skill-Print card */}
          <SkillPrintCard
            occupationCode={occupationCode}
            occupationTitle={occupationTitle}
            categories={categories}
            displayName={displayName}
            dateStr={dateStr}
          />

          {/* Actions */}
          <div className="no-print flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#1e3a5f] text-white font-bold hover:bg-[#162d4a] transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download free Skill-Print (PDF)
            </button>

            <div className="text-center text-xs text-gray-400 -mt-1">
              Use "Save as PDF" in your browser's print dialog.
            </div>
          </div>

          {/* Cluster upgrade teaser */}
          <div className="no-print">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">
              Want the full picture?
            </div>
            <ClusterTeaser categories={categories} />
          </div>

          {/* Start over */}
          <div className="no-print text-center">
            <Link
              href="/assess"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try a different occupation
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
