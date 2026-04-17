'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Fingerprint, LayoutDashboard } from 'lucide-react';

export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-50 mb-5">
          <CheckCircle className="w-8 h-8 text-accent-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">You're unlocked. 🎉</h1>
        <p className="text-gray-500 mb-6">
          Your Skill-Print report is saved to your account — you can run a new assessment any time and track your progress over time.
        </p>

        {/* What's next callout */}
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 mb-8 text-left">
          <p className="text-xs font-bold text-brand-700 uppercase tracking-wide mb-2">What to do next</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <Fingerprint className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
              <span>Run an assessment for any role you're targeting — your results are saved and tracked.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <ArrowRight className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
              <span>Re-assess the same role over time to see your score improve as you build skills.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/assess"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
          >
            <Fingerprint className="w-4 h-4" /> Start an assessment
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-brand-300 hover:text-brand-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> My dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
