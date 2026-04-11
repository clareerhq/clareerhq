'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Fingerprint, Zap } from 'lucide-react';

// ── Checkout button ───────────────────────────────────────────────────────────

function CheckoutButton({
  priceKey,
  label,
  variant = 'primary',
}: {
  priceKey: 'REPORT_ONE_TIME' | 'PRO_MONTHLY';
  label: string;
  variant?: 'primary' | 'secondary';
}) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      router.push('/sign-up?redirect=/upgrade');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  const base = 'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-colors';
  const styles = {
    primary: `${base} bg-brand-700 text-white hover:bg-brand-800`,
    secondary: `${base} bg-accent-500 text-white hover:bg-accent-600`,
  };

  return (
    <button onClick={handleClick} disabled={loading} className={styles[variant]}>
      {loading ? 'Redirecting…' : label}
      {!loading && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Link href="/">
          <img src="/logo.svg" alt="ClareerHQ" className="h-6 w-auto" />
        </Link>
        <Link href="/assess" className="text-sm text-gray-500 hover:text-brand-700">
          ← Back to assessment
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4">
            <Fingerprint className="w-7 h-7 text-brand-700" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Put your skill-print to work
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            You've built your skill-print. Here's how to take it further — evidence-based, role-specific, and ready to use in your next application.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">

          {/* One-time report */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">One-time</div>
                <h2 className="text-xl font-extrabold text-gray-900">Skill-Print Report</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-brand-700">$10</div>
                <div className="text-xs text-gray-400">one time</div>
              </div>
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {[
                'Full 8-domain skill-print assessment',
                'Downloadable PDF report of your complete profile',
                'Shareable link to your skill-print',
                'Yours to keep — no subscription required',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <CheckoutButton priceKey="REPORT_ONE_TIME" label="Get my skill-print report" />
          </div>

          {/* Monthly Pro */}
          <div className="bg-brand-700 rounded-2xl shadow-sm p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-xs font-bold bg-accent-500 text-white px-2.5 py-1 rounded-full">
                Most popular
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-brand-300 uppercase tracking-wide mb-1">Monthly</div>
                <h2 className="text-xl font-extrabold text-white">Pro</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white">$10</div>
                <div className="text-xs text-brand-300">per month</div>
              </div>
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {[
                'Everything in the one-time report',
                'Spec out any job posting — unlimited',
                'Resume skill-print section tailored to each role',
                'First access to every new feature',
                'Cancel anytime',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-brand-100">
                  <CheckCircle className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <CheckoutButton priceKey="PRO_MONTHLY" label="Start Pro — $10/month" variant="secondary" />
          </div>
        </div>

        {/* Free tier reminder */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <Zap className="w-4 h-4" />
            Already on the free tier? Your 3-domain skill-print is free forever.
            <Link href="/assess" className="text-brand-600 font-semibold hover:underline">
              Go back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
