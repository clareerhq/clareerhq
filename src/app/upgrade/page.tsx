'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Fingerprint, Zap, TrendingUp, Tag } from 'lucide-react';

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

        {/* Beta promo code banner */}
        <div className="mb-10 flex items-center gap-3 bg-accent-50 border border-accent-200 rounded-2xl px-5 py-4">
          <Tag className="w-5 h-5 text-accent-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-bold text-accent-800">We're in beta — it's free.</span>
            <span className="text-sm text-accent-700"> Use code </span>
            <code className="text-sm font-black text-accent-800 bg-accent-100 px-2 py-0.5 rounded-md tracking-wide">FRIENDS100</code>
            <span className="text-sm text-accent-700"> at checkout for 100% off.</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4">
            <Fingerprint className="w-7 h-7 text-brand-700" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Put your Skill-Print to work
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Your free Skill-Print is a start. Go deeper, track your growth, and match to real job postings.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">

          {/* One-time: 8-domain */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">One-time · $10</div>
                <h2 className="text-xl font-extrabold text-gray-900">Full Skill-Print</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-brand-700">$10</div>
                <div className="text-xs text-gray-400">one time</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Unlock all 8 dimensions — Skills, Knowledge, Work Styles, Abilities, Work Activities, Work Context, Job Zone, and Interests.
            </p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {[
                'Complete 8-domain Skill-Print assessment',
                'Full PDF report — every dimension rated 0–3',
                'Word & Google Docs resume template included',
                'Revisit and re-download anytime (login required)',
                'Yours to keep — no subscription needed',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <CheckoutButton priceKey="REPORT_ONE_TIME" label="Unlock full Skill-Print" />
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
                <div className="text-xs font-semibold text-brand-300 uppercase tracking-wide mb-1">Monthly · $10/mo</div>
                <h2 className="text-xl font-extrabold text-white">Pro</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white">$10</div>
                <div className="text-xs text-brand-300">per month</div>
              </div>
            </div>
            <p className="text-sm text-brand-200 mb-4">
              Everything in the full Skill-Print, plus tools to prove your growth and land the role.
            </p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {[
                'Full 8-domain Skill-Print included',
                'Paste a job posting → instant gap analysis',
                'Auto-generated resume Skill-Print section per role',
                'Progress tracking — re-assess over time and show growth to recruiters',
                'Unlimited comparisons across roles',
                'Early access to new features',
                'Cancel anytime',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-brand-100">
                  {f.includes('Progress') ? (
                    <TrendingUp className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                  )}
                  {f}
                </li>
              ))}
            </ul>
            <CheckoutButton priceKey="PRO_MONTHLY" label="Start Pro — $10/month" variant="secondary" />
          </div>
        </div>

        {/* Free tier reminder */}
        <div className="mt-8 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-gray-900">Free tier — always included</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  3-domain Skill-Print (Skills · Knowledge · Work Styles) + PDF report + resume template. Free forever with a login.
                </div>
              </div>
            </div>
            <Link href="/assess" className="text-sm text-brand-700 font-semibold hover:underline whitespace-nowrap">
              Back to assessment →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
