'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { Download, LayoutDashboard, RotateCcw, Lock, ArrowRight } from 'lucide-react';
import { track } from '@/lib/posthog';
import { computeSkillPrint } from '@/lib/scoring';
import type { PipValue, SkillPrintCategory } from '@/lib/scoring';
import type { DomainRatings } from '@/types/onet';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClusterPayload {
  clusterCode: string;
  clusterTitle: string;
  occupationCode: string;
  occupationTitle: string;
  ratings: DomainRatings[];
}

// ── Pip display ───────────────────────────────────────────────────────────────

function Pips({ value, size = 'md' }: { value: PipValue; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5';
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

// ── Cluster Skill-Print card ───────────────────────────────────────────────────
// Half-page format: category headers with pips + all individual skills listed.

function ClusterSkillPrintCard({
  occupationCode,
  occupationTitle,
  clusterTitle,
  categories,
  displayName,
  dateStr,
}: {
  occupationCode: string;
  occupationTitle: string;
  clusterTitle: string;
  categories: SkillPrintCategory[];
  displayName: string | null;
  dateStr: string;
}) {
  // Only render categories that have at least one rated element
  const activeCategories = categories.filter(
    (c) => c.pip > 0 || c.elements.length > 0
  );

  return (
    <div
      id="cluster-skillprint-card"
      className="bg-white rounded-xl border border-[#1e3a5f] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563a8] px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] tracking-[0.12em] uppercase text-white/50 font-bold mb-1">
            Skill-Print · Career Cluster
          </div>
          <div className="text-lg font-bold text-white leading-tight">
            {occupationTitle}
          </div>
          <div className="mt-1.5 inline-flex items-center bg-white/15 rounded-full px-2.5 py-0.5">
            <span className="text-[9px] font-semibold text-white/80 uppercase tracking-wide">
              {clusterTitle}
            </span>
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

      {/* Category sections */}
      <div className="px-5 py-4 flex flex-col gap-5">
        {activeCategories.map(({ key, label, pip, elements }) => (
          <div key={key}>
            {/* Category header row */}
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[12px] font-bold text-[#1e3a5f] uppercase tracking-wide flex-1">
                {label}
              </div>
              <Pips value={pip} />
            </div>

            {/* Individual skills in two columns */}
            {elements.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                {elements.map(({ id, name, pip: ePip }) => (
                  <div key={id} className="flex items-center gap-2">
                    <div className="text-[11px] text-gray-600 flex-1 leading-tight truncate">
                      {name}
                    </div>
                    <Pips value={ePip} size="sm" />
                  </div>
                ))}
              </div>
            )}

            {/* Divider between categories */}
            <div className="mt-4 border-b border-gray-100 last:border-0" />
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

// ── Payment gate ──────────────────────────────────────────────────────────────

function PaymentGate() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#e8eef5] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-[#1e3a5f]" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Cluster Skill-Print
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          The full cluster Skill-Print — every skill across every occupation in your career cluster — is a one-time $10 unlock.
        </p>
        {isSignedIn ? (
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-bold text-sm hover:bg-[#162d4a] transition-colors"
          >
            Get the cluster Skill-Print — $10
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="flex flex-col gap-3">
            <Link
              href="/sign-up?redirect=/upgrade"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-bold text-sm hover:bg-[#162d4a] transition-colors"
            >
              Create account &amp; unlock — $10
            </Link>
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link href="/sign-in?redirect=/upgrade" className="text-[#1e3a5f] font-semibold">
                Sign in →
              </Link>
            </p>
          </div>
        )}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link href="/results" className="text-xs text-gray-400 hover:text-gray-600">
            ← Back to your free Skill-Print
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface UserStatus {
  authenticated: boolean;
  reportPurchased: boolean;
  plan: 'FREE' | 'REPORT_ONE_TIME' | 'PRO';
}

export default function ClusterResultsPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [payload, setPayload] = useState<ClusterPayload | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user plan status
  useEffect(() => {
    if (!isSignedIn) {
      setUserStatus({ authenticated: false, reportPurchased: false, plan: 'FREE' });
      return;
    }
    fetch('/api/user/status')
      .then((r) => r.json())
      .then(setUserStatus)
      .catch(() => setUserStatus({ authenticated: true, reportPurchased: false, plan: 'FREE' }));
  }, [isSignedIn]);

  // Load cluster payload from sessionStorage
  useEffect(() => {
    const raw =
      sessionStorage.getItem('chq_cluster_payload') ??
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('chq_cluster_payload_backup')
        : null);

    if (!raw) {
      // No cluster payload — send them to the cluster assessment or free results
      // If they have the free occupation results, send them to the cluster assessment
      const freeRaw = sessionStorage.getItem('chq_results_payload');
      if (freeRaw) {
        router.push('/assess/cluster');
      } else {
        router.push('/assess');
      }
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ClusterPayload;
      setPayload(parsed);
      track('skillprint_viewed', {
        occupation_code: parsed.occupationCode,
        occupation_title: parsed.occupationTitle,
      });
    } catch {
      router.push('/assess');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Don't show content until we know plan status
  useEffect(() => {
    if (userStatus !== null) setLoading(false);
  }, [userStatus]);

  // Show spinner while loading
  if (loading || !userStatus || !payload) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Gate: user must have paid ($10 one-time or Pro)
  const hasPaid =
    userStatus.plan === 'REPORT_ONE_TIME' || userStatus.plan === 'PRO' || userStatus.reportPurchased;

  if (!hasPaid) {
    return <PaymentGate />;
  }

  // Compute cluster Skill-Print
  const { clusterCode, clusterTitle, occupationCode, occupationTitle, ratings } = payload;
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
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
          #cluster-skillprint-card {
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
        <div className="flex items-center gap-4">
          <Link
            href="/results"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Free Skill-Print
          </Link>
          {isSignedIn && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a5f] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-lg mx-auto flex flex-col gap-6">

          {/* Page heading */}
          <div className="no-print text-center">
            <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mb-2">
              {clusterTitle} Career Cluster
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your cluster Skill-Print is ready.
            </h1>
            <p className="text-gray-500 text-sm">
              Every skill across your cluster — rated, ranked, and ready for your resume.
            </p>
          </div>

          {/* The Cluster Skill-Print card */}
          <ClusterSkillPrintCard
            occupationCode={occupationCode}
            occupationTitle={occupationTitle}
            clusterTitle={clusterTitle}
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
              Download cluster Skill-Print (PDF)
            </button>
            <div className="text-center text-xs text-gray-400 -mt-1">
              Use "Save as PDF" in your browser's print dialog.
            </div>
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
