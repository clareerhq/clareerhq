'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-50 mb-5">
          <CheckCircle className="w-8 h-8 text-accent-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">You're in.</h1>
        <p className="text-gray-500 mb-8">
          Your skill-print just got a lot more powerful. Head to your dashboard to see what's unlocked.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
          >
            Go to my dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/assess"
            className="text-sm text-gray-500 hover:text-brand-700 transition-colors"
          >
            Spec out a job now →
          </Link>
        </div>
      </div>
    </div>
  );
}
