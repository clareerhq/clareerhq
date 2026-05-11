'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Fingerprint, Zap, TrendingUp, Tag, Layers } from 'lucide-react';

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
    primary: `${base} bg-[#1e3a5f] text-white hover:bg-[#162d4a]`,
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
          <img src="/logo.svg" alt="Skill-Print" className="h-6 w-auto" />
        </Link>
        <Link href="/results" className="text-sm text-gray-500 hover:text-[#1e3a5f]">
          ← Back to your Skill-Print
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e8eef5] mb-4">
            <Fingerprint className="w-7 h-7 text-[#1e3a5f]" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Go beyond one job title
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Your free Skill-Print captures one occupation. The full picture spans your entire career cluster — every related role, every relevant skill, one document.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">

          {/* $10 one-time: Cluster Skill-Print */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">One-time · $10</div>
                <h2 className="text-xl font-extrabold text-gray-900">Cluster Skill-Print</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-[#1e3a5f]">$10</div>
                <div className="text-xs text-gray-400">one time</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Rate yourself across every skill in your career cluster — not just one job title. See exactly where you stand across 35+ related occupations.
            </p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {[
                'Full career cluster Skill-Print (all 5 categories + every individual skill rated)',
                'Skills from every occupation in your cluster — not just one title',
                'PDF download sized perfectly for your resume',
                'Revisit and re-download anytime',
                'Yours to keep — no subscription needed',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <CheckoutButton priceKey="REPORT_ONE_TIME" label="Get cluster Skill-Print — $10" />
          </div>

          {/* Monthly Pro */}
          <div className="bg-[#1e3a5f] rounded-2xl shadow-sm p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-xs font-bold bg-accent-500 text-white px-2.5 py-1 rounded-full">
                Most popular
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">Monthly · $10/mo</div>
                <h2 className="text-xl font-extrabold text-white">Pro</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white">$10</div>
                <div className="text-xs text-blue-300">per month</div>
              </div>
            </div>
            <p className="text-sm text-blue-200 mb-4">
              Everything in the cluster Skill-Print, plus live tools to match yourself to real job postings and track your growth over time.
            </p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {[
                { text: 'Cluster Skill-Print included', icon: 'check' },
                { text: 'Paste a job posting → instant skill gap analysis', icon: 'check' },
                { text: 'Rate yourself across all O*NET skills — surface unexpected career matches', icon: 'check' },
                { text: 'Progress tracking — reassess and show growth to recruiters', icon: 'trend' },
                { text: 'Unlimited comparisons across roles', icon: 'check' },
                { text: 'Early access to new features', icon: 'check' },
                { text: 'Cancel anytime', icon: 'check' },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-2 text-sm text-blue-100">
                  {f.icon === 'trend' ? (
                    <TrendingUp className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                  )}
                  {f.text}
                </li>
              ))}
            </ul>
            <CheckoutButton priceKey="PRO_MONTHLY" label="Start Pro — $10/month" variant="secondary" />
          </div>
        </div>

        {/* Bundle pricing note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Committed to your growth? Ask about our 3- and 4-month Pro bundles — same features, better rate.{' '}
            <a href="mailto:clareerhq@gmail.com" className="text-[#1e3a5f] font-semibold hover:underline">
              Get in touch →
            </a>
          </p>
        </div>

        {/* Free tier reminder */}
        <div className="mt-8 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#1e3a5f] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-gray-900">Free tier — always included</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Single-occupation Skill-Print (5 categories, 0–3 pips) + PDF download. Free forever, no login required.
                </div>
              </div>
            </div>
            <Link href="/results" className="text-sm text-[#1e3a5f] font-semibold hover:underline whitespace-nowrap">
              View your Skill-Print →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
