'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, ChevronDown, Fingerprint } from 'lucide-react';
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

const DOMAINS_IN_ORDER: AssessmentDomain[] = ['skills', 'knowledge', 'work_styles'];
const DOMAIN_TITLES: Record<string, string> = {
  skills: 'Skills',
  knowledge: 'Knowledge Areas',
  work_styles: 'Work Styles',
};
const DOMAIN_DESCS: Record<string, string> = {
  skills: 'How well can you perform these work-related skills?',
  knowledge: 'How familiar are you with these knowledge areas?',
  work_styles: 'How closely do these work styles describe you?',
};

const RATING_COLORS: Record<UserRating, string> = {
  0: 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200',
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
  const [occupationData, setOccupationData] = useState<OccupationData | null>(null);
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
    fetch(`/api/onet/details/${encodeURIComponent(code)}?domains=skills,knowledge,work_styles`)
      .then(async (r) => {
        const data = await r.json();
        // Check for API-level errors (non-OK status or error field in response)
        if (!r.ok || data.error) {
          setError(
            'Could not load occupation data from O*NET. ' +
            (data.error ?? `Server returned ${r.status}.`) +
            ' Please try again or go back and pick another occupation.'
          );
          setLoading(false);
          return;
        }
        const hasAnyData = DOMAINS_IN_ORDER.some(
          (d) => (data.domains?.[d] ?? []).length > 0
        );
        if (!hasAnyData) {
          setError(
            "O*NET doesn't have detailed skills data for this occupation yet — " +
            "it may be a newer role still being added to the database. " +
            "Try searching for a similar occupation (e.g. \"Computer Scientist\" or \"Statistician\")."
          );
          setLoading(false);
          return;
        }
        setOccupationData(data as OccupationData);
        setLoading(false);
        const stored2 = JSON.parse(sessionStorage.getItem('chq_occupation') ?? '{}');
        track('assessment_started', {
          occupation_code: stored2.code,
          occupation_title: stored2.title,
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

  const currentDomain = DOMAINS_IN_ORDER[domainIndex];
  // Use ?. on both occupationData AND domains to guard against error-shaped responses
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

  // Step breadcrumb items — the 3 domain steps + final "Skill Print" destination
  const STEPS: Array<{ key: string; label: string; isResult?: boolean }> = [
    { key: 'skills', label: 'Skills' },
    { key: 'knowledge', label: 'Knowledge Areas' },
    { key: 'work_styles', label: 'Work Styles' },
    { key: 'skillprint', label: 'Skill Print', isResult: true },
  ];

  function handleNext() {
    track('assessment_domain_completed', {
      domain: currentDomain,
      step: domainIndex + 1,
      rated_count: ratedCount,
    });
    if (domainIndex < DOMAINS_IN_ORDER.length - 1) {
      setDomainIndex((i) => i + 1);
      setExpanded(new Set());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // All domains done — build ratings payload and navigate to results
      if (!occupationData) return;
      const ratingsPayload = DOMAINS_IN_ORDER.map((domain) => ({
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
      sessionStorage.setItem(
        'chq_results_payload',
        JSON.stringify({
          occupationCode: stored.code,
          occupationTitle: stored.title,
          ratings: ratingsPayload,
        })
      );
      router.push('/results');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading occupation data from O*NET…</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header with logo + step breadcrumb */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        {/* Logo row */}
        <div className="px-6 pt-3 pb-2 max-w-2xl mx-auto flex items-center justify-between">
          <a href="/">
            <img src="/logo.svg" alt="ClareerHQ" className="h-6 w-auto" />
          </a>
          <span className="text-xs text-gray-400">
            {ratedCount}/{totalCount} rated
          </span>
        </div>

        {/* Step breadcrumb: Skills > Knowledge Areas > Work Styles > Skill Print */}
        <div className="px-4 pb-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((step, i) => {
              const isDone = i < domainIndex;
              const isActive = !step.isResult && i === domainIndex;
              const isFuture = !step.isResult && i > domainIndex;
              const isResultStep = step.isResult;

              return (
                <div key={step.key} className="flex items-center gap-1 flex-1 min-w-0">
                  {/* Step pill */}
                  <div className={`
                    flex-1 min-w-0 flex flex-col items-center gap-0.5
                  `}>
                    {/* Dot indicator */}
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                      ${isDone
                        ? 'bg-accent-500'
                        : isActive
                        ? 'bg-brand-700 ring-2 ring-brand-200'
                        : isResultStep
                        ? 'bg-gray-100 border-2 border-dashed border-gray-300'
                        : 'bg-gray-100 border border-gray-200'}
                    `}>
                      {isDone ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      ) : isResultStep ? (
                        <Fingerprint className="w-3 h-3 text-gray-400" />
                      ) : (
                        <span className={`text-[9px] font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    {/* Label */}
                    <span className={`
                      text-[10px] font-semibold text-center leading-tight truncate w-full px-0.5
                      ${isDone ? 'text-accent-600' : isActive ? 'text-brand-700' : 'text-gray-400'}
                    `}>
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line between steps */}
                  {i < STEPS.length - 1 && (
                    <div className={`
                      h-px w-4 flex-shrink-0 rounded-full transition-all
                      ${i < domainIndex ? 'bg-accent-400' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Occupation badge — clean, no raw code shown */}
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
                    <div className="text-xs text-gray-400">O*NET importance</div>
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
          {domainIndex < DOMAINS_IN_ORDER.length - 1 ? (
            <>
              Next: {DOMAIN_TITLES[DOMAINS_IN_ORDER[domainIndex + 1]]}
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

      {/* Floating expand/collapse all pill */}
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
