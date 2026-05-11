'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import type { UserRating, AssessmentDomain } from '@/types/onet';
import { RATING_LABELS } from '@/types/onet';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClusterSkillElement {
  id: string;
  name: string;
  avgImportance: number;
  avgLevel: number;
  occupationCount: number;
}

interface ClusterDomain {
  domain: AssessmentDomain;
  label: string;
  elements: ClusterSkillElement[];
}

interface ClusterSkillsResponse {
  clusterCode: string;
  clusterTitle: string;
  totalOccupations: number;
  sampledOccupations: number;
  domains: ClusterDomain[];
}

interface UserStatus {
  authenticated: boolean;
  reportPurchased: boolean;
  plan: 'FREE' | 'REPORT_ONE_TIME' | 'PRO';
}

// ── Rating buttons ─────────────────────────────────────────────────────────────

const RATING_COLORS: Record<UserRating, string> = {
  0: 'bg-gray-100 text-gray-500 border-gray-200',
  1: 'bg-amber-50 text-amber-700 border-amber-300',
  2: 'bg-blue-50 text-blue-700 border-blue-300',
  3: 'bg-green-50 text-green-700 border-green-300',
};

function RatingButtons({
  value,
  onChange,
}: {
  value: UserRating | null;
  onChange: (r: UserRating) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {([0, 1, 2, 3] as UserRating[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            value === r
              ? RATING_COLORS[r]
              : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {RATING_LABELS[r]}
        </button>
      ))}
    </div>
  );
}

// ── Payment gate ───────────────────────────────────────────────────────────────

function PaymentGate({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#e8eef5] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-[#1e3a5f]" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Cluster assessment is a paid feature
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          The cluster Skill-Print — every skill across your career cluster — unlocks with a one-time $10 purchase.
        </p>
        {isSignedIn ? (
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-bold text-sm hover:bg-[#162d4a] transition-colors"
          >
            Unlock for $10
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

const DOMAIN_DESCS: Partial<Record<AssessmentDomain, string>> = {
  skills: 'How well can you perform these work-related skills?',
  knowledge: 'How familiar are you with these knowledge areas?',
  abilities: 'How well do these abilities describe what you\'re capable of?',
  work_activities: 'How often would you perform these types of activities?',
  technology_skills: 'How comfortable are you with these tools and technologies?',
};

export default function ClusterAssessPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [occupationCode, setOccupationCode] = useState('');
  const [occupationTitle, setOccupationTitle] = useState('');
  const [clusterCode, setClusterCode] = useState('');
  const [clusterTitle, setClusterTitle] = useState('');
  const [domains, setDomains] = useState<ClusterDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [domainIndex, setDomainIndex] = useState(0);
  const [allRatings, setAllRatings] = useState<
    Record<string, Record<string, UserRating>>
  >({});

  // 1. Check payment status
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

  // 2. Load occupation + cluster + cluster skills
  const loadClusterData = useCallback(async () => {
    const raw = sessionStorage.getItem('chq_results_payload');
    if (!raw) {
      router.push('/assess');
      return;
    }

    let occCode = '';
    let occTitle = '';
    try {
      const parsed = JSON.parse(raw);
      occCode = parsed.occupationCode;
      occTitle = parsed.occupationTitle;
      setOccupationCode(occCode);
      setOccupationTitle(occTitle);
    } catch {
      router.push('/assess');
      return;
    }

    try {
      // Resolve occupation → cluster
      const clusterRes = await fetch(
        `/api/onet/occupation-cluster?code=${encodeURIComponent(occCode)}`
      );
      if (!clusterRes.ok) throw new Error('Could not find cluster for this occupation');
      const clusterInfo = await clusterRes.json();
      const primaryCluster = clusterInfo.career_cluster?.[0];
      if (!primaryCluster) throw new Error('No career cluster found for this occupation');

      setClusterCode(primaryCluster.code);
      setClusterTitle(primaryCluster.title);

      // Fetch aggregated cluster skills
      const skillsRes = await fetch(
        `/api/onet/cluster-skills?cluster=${encodeURIComponent(primaryCluster.code)}`
      );
      if (!skillsRes.ok) throw new Error('Failed to load cluster skills');
      const skillsData: ClusterSkillsResponse = await skillsRes.json();

      // Only keep domains with at least one element
      const activeDomains = skillsData.domains.filter((d) => d.elements.length > 0);
      setDomains(activeDomains);
      setClusterTitle(skillsData.clusterTitle || primaryCluster.title);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load cluster data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (userStatus === null) return; // Wait for payment check
    const hasPaid =
      userStatus.plan === 'REPORT_ONE_TIME' ||
      userStatus.plan === 'PRO' ||
      userStatus.reportPurchased;
    if (!hasPaid) {
      setLoading(false);
      return;
    }
    loadClusterData();
  }, [userStatus, loadClusterData]);

  function setRating(domain: string, elementId: string, rating: UserRating) {
    setAllRatings((prev) => ({
      ...prev,
      [domain]: { ...(prev[domain] ?? {}), [elementId]: rating },
    }));
  }

  function handleNext() {
    if (domainIndex < domains.length - 1) {
      setDomainIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Build cluster payload
      const ratingsPayload = domains.map((d) => ({
        domain: d.domain,
        elements: d.elements.map((el) => ({
          elementId: el.id,
          elementName: el.name,
          rating: (allRatings[d.domain]?.[el.id] ?? 0) as UserRating,
          onetImportance: el.avgImportance,
          onetLevel: el.avgLevel,
        })),
      }));

      const payload = JSON.stringify({
        clusterCode,
        clusterTitle,
        occupationCode,
        occupationTitle,
        ratings: ratingsPayload,
      });
      sessionStorage.setItem('chq_cluster_payload', payload);
      try { localStorage.setItem('chq_cluster_payload_backup', payload); } catch (_) {}
      router.push('/results/cluster');
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading || userStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your career cluster…</p>
        </div>
      </div>
    );
  }

  const hasPaid =
    userStatus.plan === 'REPORT_ONE_TIME' ||
    userStatus.plan === 'PRO' ||
    userStatus.reportPurchased;

  if (!hasPaid) {
    return <PaymentGate isSignedIn={!!isSignedIn} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold mb-2">Could not load cluster data</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/results')}
            className="px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-bold hover:bg-[#162d4a] transition-colors text-sm"
          >
            ← Back to your Skill-Print
          </button>
        </div>
      </div>
    );
  }

  const currentDomain = domains[domainIndex];
  if (!currentDomain) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  const currentElements = currentDomain.elements;
  const currentRatings = allRatings[currentDomain.domain] ?? {};
  const ratedCount = Object.keys(currentRatings).length;
  const totalCount = currentElements.length;
  const stepNumber = domainIndex + 1;
  const totalSteps = domains.length;
  const progressPct = (domainIndex / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-6 pt-3 pb-2 max-w-2xl mx-auto flex items-center justify-between">
          <a href="/">
            <img src="/logo.svg" alt="Skill-Print" className="h-6 w-auto" />
          </a>
          <span className="text-xs text-gray-400">
            {ratedCount}/{totalCount} rated
          </span>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-1 max-w-2xl mx-auto">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e3a5f] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step label */}
        <div className="px-6 pb-3 max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1e3a5f]">
            Step {stepNumber} of {totalSteps} · {currentDomain.label}
          </span>
          <span className="text-xs text-gray-400">
            {totalSteps - domainIndex - 1 > 0
              ? `${totalSteps - domainIndex - 1} more after this`
              : 'Last step'}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Cluster badge */}
        <div className="mb-6 p-4 rounded-xl bg-[#e8eef5] border border-[#c5d5e8]">
          <div className="text-xs text-[#1e3a5f] font-semibold uppercase tracking-wide mb-0.5">
            Cluster Skill-Print for
          </div>
          <div className="font-bold text-[#1e3a5f] text-lg">{occupationTitle}</div>
          <div className="text-xs text-[#2563a8] mt-0.5">{clusterTitle} cluster</div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {currentDomain.label}
        </h2>
        <p className="text-sm text-gray-500 mb-2">
          {DOMAIN_DESCS[currentDomain.domain] ?? 'Rate yourself on each item.'}
        </p>
        <p className="text-xs text-gray-400 mb-6">
          These skills appear across occupations in your cluster. Skip any that don't apply — only rated items appear on your Skill-Print.
        </p>

        {/* Element list */}
        <div className="space-y-3 mb-8">
          {currentElements.map((el) => (
            <div
              key={el.id}
              className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="font-semibold text-gray-900 text-sm">{el.name}</span>
                {el.avgImportance > 0 && (
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    avg. importance {el.avgImportance.toFixed(1)}/5
                  </span>
                )}
              </div>
              <RatingButtons
                value={(currentRatings[el.id] as UserRating | undefined) ?? null}
                onChange={(r) => setRating(currentDomain.domain, el.id, r)}
              />
            </div>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#1e3a5f] text-white font-bold hover:bg-[#162d4a] transition-colors"
        >
          {domainIndex < domains.length - 1 ? (
            <>
              Next: {domains[domainIndex + 1]?.label}
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              See My Cluster Skill-Print
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
