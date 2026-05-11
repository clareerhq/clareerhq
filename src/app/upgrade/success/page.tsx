'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Layers, LayoutDashboard } from 'lucide-react';

export default function UpgradeSuccessPage() {
  const [hasOccupation, setHasOccupation] = useState(false);

  useEffect(() => {
    // If the user has already done a free assessment, send them straight to the cluster flow
    const hasPayload = Boolean(sessionStorage.getItem('chq_results_payload'));
    setHasOccupation(hasPayload);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">You're in. 🎉</h1>
        <p className="text-gray-500 mb-6">
          Time to rate yourself across your full career cluster — every skill, every domain, all in one place.
        </p>

        {/* What's next callout */}
        <div className="bg-[#e8eef5] border border-[#c5d5e8] rounded-xl px-5 py-4 mb-8 text-left">
          <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">What happens next</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <Layers className="w-4 h-4 text-[#1e3a5f] mt-0.5 flex-shrink-0" />
              <span>
                {hasOccupation
                  ? "We'll pull all skills from your career cluster and let you rate each one 0\u20133."
                  : "Start an assessment to choose your occupation. Then rate every skill in your cluster."}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <ArrowRight className="w-4 h-4 text-[#1e3a5f] mt-0.5 flex-shrink-0" />
              <span>
                {"You'll get a full-cluster Skill-Print \u2014 half a resume page, every skill rated, ready to download as PDF."}
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          {hasOccupation ? (
            <Link
              href="/assess/cluster"
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1e3a5f] text-white font-bold hover:bg-[#162d4a] transition-colors"
            >
              <Layers className="w-4 h-4" /> Rate my cluster skills
            </Link>
          ) : (
            <Link
              href="/assess"
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1e3a5f] text-white font-bold hover:bg-[#162d4a] transition-colors"
            >
              <ArrowRight className="w-4 h-4" /> Start your assessment
            </Link>
          )}
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> My dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
