import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ArrowRight, BarChart2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssessmentRow {
  id: string;
  occupationCode: string;
  occupationTitle: string;
  fitScore: number;
  createdAt: Date;
}

interface RoleGroup {
  occupationCode: string;
  occupationTitle: string;
  assessments: AssessmentRow[];   // oldest → newest
  latest: AssessmentRow;
  trend: number | null;           // pct point change from previous; null if only one
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByRole(rows: AssessmentRow[]): RoleGroup[] {
  const map = new Map<string, AssessmentRow[]>();
  for (const a of rows) {
    if (!map.has(a.occupationCode)) map.set(a.occupationCode, []);
    map.get(a.occupationCode)!.push(a);
  }
  return Array.from(map.values()).map((group) => {
    // oldest first for charting
    const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const latest = sorted[sorted.length - 1];
    const prev   = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    const trend  = prev ? Math.round((latest.fitScore - prev.fitScore) * 100) : null;
    return {
      occupationCode: latest.occupationCode,
      occupationTitle: latest.occupationTitle,
      assessments: sorted,
      latest,
      trend,
    };
  }).sort((a, b) => b.latest.createdAt.getTime() - a.latest.createdAt.getTime());
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.70 ? 'bg-accent-50 text-accent-700 border-accent-200'
    : score >= 0.50 ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs font-bold tabular-nums ${color}`}>
      {pct}%
    </span>
  );
}

function TrendBadge({ trend }: { trend: number }) {
  if (trend > 0) return (
    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
      <TrendingUp className="w-3.5 h-3.5" /> +{trend}pp
    </span>
  );
  if (trend < 0) return (
    <span className="flex items-center gap-1 text-xs font-bold text-rose-500">
      <TrendingDown className="w-3.5 h-3.5" /> {trend}pp
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
      <Minus className="w-3.5 h-3.5" /> no change
    </span>
  );
}

// Tiny sparkline-style progress dots
function ProgressDots({ assessments }: { assessments: AssessmentRow[] }) {
  if (assessments.length < 2) return null;
  const maxScore = Math.max(...assessments.map((a) => a.fitScore));
  return (
    <div className="flex items-end gap-1 h-6">
      {assessments.map((a, i) => {
        const h = Math.max(4, Math.round((a.fitScore / Math.max(maxScore, 1)) * 24));
        const isLatest = i === assessments.length - 1;
        return (
          <div
            key={a.id}
            title={`${new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${Math.round(a.fitScore * 100)}%`}
            style={{ height: `${h}px` }}
            className={`w-2 rounded-sm ${isLatest ? 'bg-accent-500' : 'bg-brand-100'}`}
          />
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const rawAssessments = await db.assessment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      occupationCode: true,
      occupationTitle: true,
      fitScore: true,
      createdAt: true,
    },
  });

  const roleGroups = groupByRole(rawAssessments as AssessmentRow[]);
  const totalAssessments = rawAssessments.length;
  const rolesTracked = roleGroups.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <a href="/">
          <img src="/logo.svg" alt="Skill-Print" className="h-7 w-auto" />
        </a>
        <UserButton afterSignOutUrl="/" />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Skill-Print</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalAssessments === 0
                ? 'Track how your skills grow over time — role by role.'
                : `${rolesTracked} role${rolesTracked !== 1 ? 's' : ''} tracked · ${totalAssessments} assessment${totalAssessments !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <Link
            href="/assess"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Assessment
          </Link>
        </div>

        {roleGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Take your first free Skill-Print to see where you stand.
            </p>
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {roleGroups.map((group) => (
              <div
                key={group.occupationCode}
                className="bg-white rounded-xl border border-gray-100 hover:border-brand-200 transition-colors overflow-hidden"
              >
                {/* Role header */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <BarChart2 className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{group.occupationTitle}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {group.assessments.length} assessment{group.assessments.length !== 1 ? 's' : ''}
                        {' · '}
                        Last:{' '}
                        {new Date(group.latest.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {group.assessments.length > 1 && (
                      <ProgressDots assessments={group.assessments} />
                    )}
                    {group.trend !== null && <TrendBadge trend={group.trend} />}
                    <ScoreBadge score={group.latest.fitScore} />
                  </div>
                </div>

                {/* Progress timeline — shown when multiple assessments exist */}
                {group.assessments.length > 1 && (
                  <div className="px-4 pb-3 border-t border-gray-50">
                    <div className="pt-3 flex items-center gap-2 overflow-x-auto">
                      {group.assessments.map((a, i) => {
                        const isLatest = i === group.assessments.length - 1;
                        const pct = Math.round(a.fitScore * 100);
                        const prevPct = i > 0 ? Math.round(group.assessments[i - 1].fitScore * 100) : null;
                        const delta = prevPct !== null ? pct - prevPct : null;
                        return (
                          <div key={a.id} className="flex items-center gap-2 flex-shrink-0">
                            {i > 0 && (
                              <div className="w-6 h-px bg-gray-200" />
                            )}
                            <div className={`text-center px-2.5 py-1.5 rounded-lg border ${isLatest ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-100'}`}>
                              <div className={`text-xs font-black tabular-nums ${isLatest ? 'text-brand-700' : 'text-gray-500'}`}>
                                {pct}%
                              </div>
                              <div className="text-[10px] text-gray-400 whitespace-nowrap">
                                {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              {delta !== null && (
                                <div className={`text-[10px] font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                                  {delta > 0 ? `+${delta}` : delta}pp
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex-shrink-0 ml-2">
                        <Link
                          href="/assess"
                          className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 whitespace-nowrap"
                        >
                          <Plus className="w-3 h-3" /> Re-assess
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pro upsell — progress tracking */}
        {totalAssessments > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-brand-700 text-white flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold mb-0.5">Share your progress with recruiters</div>
              <div className="text-brand-200 text-xs">
                Pro members get a shareable progress link — show hiring managers exactly how you've grown in each role over time.
              </div>
            </div>
            <Link
              href="/upgrade"
              className="flex-shrink-0 text-xs font-bold bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
