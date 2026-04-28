'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import type { UserRating, AssessmentDomain } from '@/types/onet';
import { track } from '@/lib/posthog';
import { RATING_LABELS } from '@/types/onet';

interface OnetElement {
  id: string;
  name: string;
  description: string;
  score?: { value: number; level?: number };
}

interface DomainData {
  [domain: string]: OnetElement[];
}

interface OccupationData {
  details: { code: string; title: string; description: string };
  domains: DomainData;
}

// All 8 domains — fetched in this order, empty ones are skipped
const ALL_DOMAINS: AssessmentDomain[] = [
  'skills',
  'knowledge',
  'work_styles',
  'abilities',
  'interests',
  'work_activities',
  'work_context',
  'technology_skills',
];

const DOMAIN_TITLES: Record<string, string> = {
  skills:             'Skills',
  knowledge:          'Knowledge Areas',
  work_styles:        'Work Styles',
  abilities:          'Abilities',
  interests:          'Interests',
  work_activities:    'Work Activities',
  work_context:       'Work Context',
  technology_skills:  'Technology Skills',
};

const DOMAIN_DESCS: Record<string, string> = {
  skills:            'How well can you perform these work-related skills?',
  knowledge:         'How familiar are you with these knowledge areas?',
  work_styles:       'How closely do these work styles describe you?',
  abilities:         'How well do these abilities describe what you\'re capable of?',
  interests:         'How much do these types of work interest you?',
  work_activities:   'How often would you perform these types of activities?',
  work_context:      'How well does this work environment fit you?',
  technology_skills: 'How comfortable are you with these tools and technologies?',
};

const RATING_COLORS: Record<UserRating, string> = {
  0: 'bg-gray-200 text-gray-700 border-gray-400',
  1: 'bg-amber-50 text-amber-700 border-amber-300',
  2: 'bg-blue-50 text-blue-700 border-blue-300',
  3: 'bg-green-50 text-green-700 border-green-300',
};

// ── Rating buttons ─────────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DomainsPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [occupationData, setOccupationData] = useState<OccupationData | null>(null);
  const [activeDomains, setActiveDomains] = useState<AssessmentDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [domainIndex, setDomainIndex] = useState(0);
  const [allRatings, setAllRatings] = useState<
    Record<string, Record<string, UserRating>>
  >({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = sessionStorage.getItem('chq_occupation');
    if (!stored) {
      router.push('/assess');
      return;
    }
    const { code } = JSON.parse(stored);
    const domainParam = ALL_DOMAINS.join(',');
    fetch(`/api/onet/details/${encodeURIComponent(code)}?domains=${domainParam}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data.error) {
          setError(
            'Could not load occupation data. ' +
            (data.error ?? `Server returned ${r.status}.`) +
            ' Please try again or go back and pick another occupation.'
          );
          setLoading(false);
          return;
        }
        // Only include domains that have data for this occupation
        const domains = ALL_DOMAINS.filter(
          (d) => (data.domains?.[d] ?? []).length > 0
        );
        if (domains.length === 0) {
          setError(
            "O*NET doesn't have detailed data for this occupation yet — " +
            "it may be a newer role still being added to the database. " +
            "Try searching for a similar occupation."
          );
          setLoading(false);
          return;
        }
        setOccupationData(data as OccupationData);
        setActiveDomains(domains);
        setLoading(false);
        const stored2 = JSON.parse(sessionStorage.getItem('chq_occupation') ?? '{}');
        track('assessment_started', {
          occupation_code: stored2.code,
          occupation_title: stored2.title,
          domain_count: domains.length,
        });
      })
      .catch(() => {
        setError('Network error loading occupation data. Please check your connection and try again.');
        setLoading(false);
      });
  }, [router]);

  function setRating(domain: string, elementId: string, rating: UserRating) {
    setAllRatings((prev) => ({
      ...prev,
      [domain]: { ...(prev[domain] ?? {}), [elementId]: rating },
    }));
  }

  const currentDomain = activeDomains[domainIndex];
  const currentElements = occupationData?.domains?.[currentDomain] ?? [];
  const currentRatings = allRatings[currentDomain] ?? {};
  const ratedCount = Object.keys(currentRatings).length;
  const totalCount = currentElements.length;

  const allExpanded = currentElements.length > 0 && currentElements.every((el) => expanded.has(el.id));

  function toggleElement(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allExpanded) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(currentElements.map((el) => el.id)));
    }
  }

  function handleNext() {
    track('assessment_domain_completed', {
      domain: currentDomain,
      step: domainIndex + 1,
      total_steps: activeDomains.length,
      rated_count: ratedCount,
    });

    if (domainIndex < activeDomains.length - 1) {
      setDomainIndex((i) => i + 1);
      setExpanded(new Set());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // All domains done — build payload and navigate to results
      if (!occupationData) return;
      const ratingsPayload = activeDomains.map((domain) => ({
        domain,
        elements: (occupationData.domains?.[domain] ?? []).map((el) => ({
          elementId: el.id,
          elementName: el.name,
          rating: (allRatings[domain]?.[el.id] ?? 0) as UserRating,
          onetImportance: el.score?.value ?? 3,
          onetLevel: el.score?.level ?? 4,
        })),
      }));
      const stored = JSON.parse(sessionStorage.getItem('chq_occupation') ?? '{}');
      const payload = JSON.stringify({
        occupationCode: stored.code,
        occupationTitle: stored.title,
        ratings: ratingsPayload,
      });
      sessionStorage.setItem('chq_results_payload', payload);
      try { localStorage.setItem('chq_results_payload_backup', payload); } catch (_) {}
      router.push('/results');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading occupation data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold mb-2">Could not load occupation data</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/assess')}
            className="px-6 py-3 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors text-sm"
          >
            ← Pick a different occupation
          </button>
        </div>
      </div>
    );
  }

  const occ = JSON.parse(sessionStorage.getItem('chq_occupation') ?? '{}');
  const stepNumber = domainIndex + 1;
  const totalSteps = activeDomains.length;
  const progressPct = ((domainIndex) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        {/* Logo row */}
        <div className="px-6 pt-3 pb-2 max-w-2xl mx-auto flex items-center justify-between">
          <a href="/">
            <img src="/logo.svg" alt="ClareerHQ" className="h-6 w-auto" />
          </a>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              {ratedCount}/{totalCount} rated
            </span>
            {isSignedIn && (
              <Link href="/dashboard" className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-700 transition-colors">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-1 max-w-2xl mx-auto">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step label */}
        <div className="px-6 pb-3 max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-xs font-semibold text-brand-700">
            Step {stepNumber} of {totalSteps} · {DOMAIN_TITLES[currentDomain]}
          </span>
          <span className="text-xs text-gray-400">
            {totalSteps - domainIndex - 1 > 0
              ? `${totalSteps - domainIndex - 1} more after this`
              : 'Last step'}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Occupation badge */}
        <div className="mb-6 p-4 rounded-xl bg-brand-50 border border-brand-100">
          <div className="text-xs text-brand-500 font-semibold uppercase tracking-wide mb-0.5">
            Building your skill-print for
          </div>
          <div className="font-bold text-brand-900 text-lg">{occ.title}</div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {DOMAIN_TITLES[currentDomain]}
        </h2>
        <p className="text-sm text-gray-500 mb-6">{DOMAIN_DESCS[currentDomain]}</p>

        {/* Element list */}
        <div className="space-y-3 mb-8">
          {currentElements.map((el) => (
            <div
              key={el.id}
              className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <button
                    onClick={() => toggleElement(el.id)}
                    className="flex items-center gap-1 group text-left w-full"
                  >
                    <span className="font-semibold text-gray-900 text-sm group-hover:text-brand-700 transition-colors underline decoration-dotted underline-offset-2 decoration-gray-300">
                      {el.name}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-brand-600 flex-shrink-0 transition-transform duration-200 ${expanded.has(el.id) ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded.has(el.id) && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      {el.description}
                    </p>
                  )}
                </div>
                {el.score?.value !== undefined && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-400">importance</div>
                    <div className="text-xs font-bold text-brand-600">
                      {el.score.value.toFixed(1)}/5.0
                    </div>
                  </div>
                )}
              </div>
              <RatingButtons
                value={(currentRatings[el.id] as UserRating | undefined) ?? null}
                onChange={(r) => setRating(currentDomain, el.id, r)}
              />
            </div>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
        >
          {domainIndex < activeDomains.length - 1 ? (
            <>
              Next: {DOMAIN_TITLES[activeDomains[domainIndex + 1]]}
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              See My Results
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Floating expand/collapse pill */}
      {currentElements.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-md text-xs font-semibold text-gray-600 hover:text-brand-700 hover:border-brand-300 hover:shadow-lg transition-all"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${allExpanded ? 'rotate-180' : ''}`} />
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      )}
    </div>
  );
}
