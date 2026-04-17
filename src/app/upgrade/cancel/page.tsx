'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UpgradeCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="text-4xl mb-4">👋</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">No worries.</h1>
        <p className="text-gray-500 mb-8">
          Your free Skill-Print is still here whenever you need it. Come back when the time is right.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
          >
            View my Skill-Print
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-brand-300 hover:text-brand-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> My dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
