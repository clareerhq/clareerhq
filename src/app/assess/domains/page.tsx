'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Info } from 'lucide-react';
import type { UserRating, AssessmentDomain } from '@/types/onet';
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
  const [tooltip, setTooltip] = useState<string | null>(null);

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
  const progress = ((domainIndex + ratedCount / Math.max(1, totalCount)) / DOMAINS_IN_ORDER.length) * 100;

  function handleNext() {
    if (domainIndex < DOMAINS_IN_ORDER.length - 1) {
      setDomainIndex((i) => i + 1);
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                {DOMAIN_TITLES[currentDomain]}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                Step {domainIndex + 1} of {DOMAINS_IN_ORDER.length}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {ratedCount}/{totalCount} rated
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Occupation badge */}
        <div className="mb-6 p-3 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide">
              Assessing
            </div>
            <div className="font-bold text-brand-900">{occ.title}</div>
          </div>
          <div className="text-xs text-brand-400">{occ.code}</div>
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
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 text-sm">{el.name}</span>
                    <button
                      onClick={() => setTooltip(tooltip === el.id ? null : el.id)}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {tooltip === el.id && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
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
    </div>
  );
}
