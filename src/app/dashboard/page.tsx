import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ArrowRight, BarChart2, Plus } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.70 ? 'bg-accent-50 text-accent-700 border-accent-200'
    : score >= 0.50 ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}>
      {pct}
    </span>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const assessments = await db.assessment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <a href="/">
          <img src="/logo.svg" alt="ClareerHQ" className="h-7 w-auto" />
        </a>
        <UserButton afterSignOutUrl="/" />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Assessments</h1>
            <p className="text-gray-500 text-sm mt-1">
              Track how your career fit evolves over time.
            </p>
          </div>
          <Link
            href="/assess"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Assessment
          </Link>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Take your first assessment to discover your career fit.
            </p>
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:border-brand-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{a.occupationTitle}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                      {' · '}
                      {a.occupationCode}
                    </div>
                  </div>
                </div>
                <ScoreBadge score={a.fitScore} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
