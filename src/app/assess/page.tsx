'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, TrendingUp, Zap, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { debounce } from '@/lib/utils';
import { track } from '@/lib/posthog';

interface OccupationResult {
  code: string;
  title: string;
  tags?: { bright_outlook?: boolean; green?: boolean };
}

interface SearchResponse {
  occupation?: OccupationResult[];
  total?: number;
}

// ── Occupation card ───────────────────────────────────────────────────────────

function OccupationCard({
  occ,
  onSelect,
}: {
  occ: OccupationResult;
  onSelect: (code: string, title: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(occ.code, occ.title)}
      className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-brand-300 hover:bg-brand-50 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
            {occ.title}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{occ.code}</div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
          {occ.tags?.bright_outlook && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              <TrendingUp className="w-3 h-3" /> Bright Outlook
            </span>
          )}
          {occ.tags?.green && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              <Zap className="w-3 h-3" /> Green
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AssessPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OccupationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/onet/occupations?q=${encodeURIComponent(q)}&end=15`);
        const data: SearchResponse = await res.json();
        const occupations = data.occupation ?? [];
        setResults(occupations);
        track('occupation_searched', { query: q, result_count: occupations.length });
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 400),
    []
  );

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setLoading(val.trim().length > 0);
    doSearch(val);
  }

  function handleSelect(code: string, title: string, source: 'search' | 'popular' = 'search') {
    track('occupation_selected', { occupation_code: code, occupation_title: title, source });
    // Store selection and navigate to domain assessment
    sessionStorage.setItem('chq_occupation', JSON.stringify({ code, title }));
    router.push('/assess/domains');
  }

  // Popular starting points
  const popular = [
    { code: '15-1221.00', title: 'Data Scientist' },
    { code: '15-1252.00', title: 'Software Developer' },
    { code: '11-2021.00', title: 'Marketing Manager' },
    { code: '13-2011.00', title: 'Accountant' },
    { code: '29-1141.00', title: 'Registered Nurse' },
    { code: '25-2021.00', title: 'Elementary School Teacher' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Link href="/">
          <img src="/logo.svg" alt="ClareerHQ" className="h-7 w-auto" />
        </Link>
        {isSignedIn && (
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        )}
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <img src="/logo.svg" alt="ClareerHQ" className="h-8 w-auto mx-auto mb-8" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Spec out a role
          </h1>
          <p className="text-gray-500">
            Search any job title — we'll pull the O*NET-verified skills, knowledge areas, and work styles that role actually requires, then map your skill-print against it.
          </p>
        </div>

        {/* Search box */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="e.g. Data Analyst, Nurse, Project Manager…"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 text-base shadow-sm"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 animate-spin" />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 mb-8 animate-fade-in">
            {results.map((occ) => (
              <OccupationCard key={occ.code} occ={occ} onSelect={handleSelect} />
            ))}
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-8 mb-8">
            No occupations found for "{query}". Try a different keyword.
          </div>
        )}

        {/* Popular picks */}
        {!searched && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Popular starting points
            </p>
            <div className="grid grid-cols-2 gap-2">
              {popular.map((p) => (
                <button
                  key={p.code}
                  onClick={() => handleSelect(p.code, p.title, 'popular')}
                  className="text-left p-3 rounded-xl border border-gray-100 hover:border-brand-300 hover:bg-brand-50 transition-all text-sm font-medium text-gray-700"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
