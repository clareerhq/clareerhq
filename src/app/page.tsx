'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Target, TrendingUp, CheckCircle, ChevronRight, Fingerprint, Layers, Zap } from 'lucide-react';

// ── Waitlist form ─────────────────────────────────────────────────────────────

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing' }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-accent-600 font-semibold">
        <CheckCircle className="w-5 h-5" />
        You're on the list — we'll be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2.5 rounded-xl bg-brand-100 text-brand-800 font-semibold text-sm hover:bg-brand-200 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? 'Joining…' : 'Get Pro updates'}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-1">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-brand-700">
              Clareer<span className="text-accent-600">HQ</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium tracking-wide hidden sm:block">
              Your headquarters for career clarity
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-gray-500 hover:text-brand-700 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/assess"
              className="px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 text-accent-700 text-xs font-semibold mb-6 border border-accent-200">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
            Built on O*NET — the U.S. Department of Labor's career database
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            What's your
            <br />
            <span className="text-brand-700">skill-print?</span>
          </h1>
          <p className="text-lg text-gray-500 mb-4 max-w-xl mx-auto leading-relaxed">
            Like a fingerprint, your skill-print is uniquely yours — a precise map of what you
            actually bring to the table and how it stacks up against any role in the market.
          </p>
          <p className="text-base text-gray-400 mb-10 max-w-lg mx-auto">
            Pick any job title. Rate yourself honestly. Get your fit score in under 10 minutes.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/assess"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-700 text-white font-bold text-lg hover:bg-brand-800 transition-colors shadow-md"
            >
              Find my skill-print
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-gray-400">Free forever · No resume required · No credit card</p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '1,000+', label: 'Careers skill-printed' },
            { value: '$0', label: '3-domain skill-print, free forever' },
            { value: '$10', label: 'Full 8-domain skill-print report', accent: true },
            { value: '$10/mo', label: 'Unlimited job specs + early access', accent: true },
          ].map((s) => (
            <div key={s.label}>
              <div className={`text-2xl font-extrabold ${s.accent ? 'text-accent-600' : 'text-brand-700'}`}>
                {s.value}
              </div>
              <div className={`text-sm mt-1 ${s.accent ? 'text-accent-700 font-semibold' : 'text-gray-500'}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            The resume game is broken.
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed mb-6">
            Candidates apply to dozens of jobs they may not actually fit — because there's no honest
            signal about where their skills really land. Recruiters sift through hundreds of
            keyword-stuffed resumes looking for something real. Everyone wastes time.
          </p>
          <p className="text-lg text-gray-700 font-medium leading-relaxed">
            ClareerHQ replaces the guessing game with your skill-print — a standardized,
            honest assessment of what you can do and how it maps to the work that actually
            needs doing. Know where you stand before you apply.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14 max-w-lg mx-auto">
            Three steps. Ten minutes. A skills map built on real labor market data.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                step: '1',
                title: 'Start with any job title',
                desc: 'Search any of 1,000+ careers — from Data Analyst to Nurse Practitioner — or pick from popular starting points.',
              },
              {
                icon: BarChart3,
                step: '2',
                title: 'Rate your real skills',
                desc: 'Score yourself across the skills, knowledge areas, and work styles that role actually requires. Honest beats optimistic.',
              },
              {
                icon: TrendingUp,
                step: '3',
                title: 'Get your skill-print',
                desc: 'See your fit score, your strongest areas, and the gaps worth closing. Then spec it out against a real job posting to go from self-aware to application-ready.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-brand-700" />
                </div>
                <div className="absolute top-5 right-5 text-5xl font-black text-gray-50 select-none">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            What's in your skill-print
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-lg mx-auto">
            Not a personality quiz. Not a keyword matcher. A real skills assessment built on the
            same occupational data used by career counselors and workforce planners nationwide.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: Fingerprint,
                title: 'Your fit score (0–100)',
                desc: 'A single, honest number showing how well your current skills match what a role actually requires — weighted by what matters most.',
              },
              {
                icon: Layers,
                title: 'Domain breakdown',
                desc: 'See your match across Skills, Knowledge, and Work Styles separately — so you know exactly where you\'re strong and where the gaps are.',
              },
              {
                icon: Target,
                title: 'Gap analysis',
                desc: 'Pinpoint the specific skills worth developing to move the needle on your fit. No generic advice — just the exact gaps for that role.',
              },
              {
                icon: TrendingUp,
                title: 'Better-fit alternatives',
                desc: 'Discover adjacent careers where your existing skills land even higher. Sometimes the best opportunity is one title away.',
              },
              {
                icon: CheckCircle,
                title: 'O*NET-powered data',
                desc: 'Every assessment uses the U.S. Department of Labor\'s official occupational database — standardized, updated, and trusted.',
              },
              {
                icon: Zap,
                title: 'Coming: skill-print resume section',
                desc: 'A new header section for your resume — standardized, evidence-based, and tailored to the specific role. The artifact every hiring manager actually wants to see in 2026.',
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-4.5 h-4.5 text-brand-700 w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{f.title}</div>
                  <div className="text-gray-500 text-sm mt-1 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro waitlist */}
      <section className="py-16 px-6 bg-brand-50 border-y border-brand-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Coming Soon — Pro</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            The resume section everyone's missing
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Spec out any job posting against your skill-print, generate an evidence-based resume section
            tailored to the role, and get the full 8-domain report. Be first to know when it launches.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/upgrade"
              className="px-6 py-3 rounded-xl bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
            >
              See pricing — from $10
            </Link>
            <Link
              href="/assess"
              className="px-6 py-3 rounded-xl border border-brand-200 text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors"
            >
              Try free first
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 bg-brand-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Your skill-print is waiting.</h2>
          <p className="text-brand-200 mb-8">
            The new top section of your resume — evidence-based, role-specific, and built in minutes. Free to start.
          </p>
          <Link
            href="/assess"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-lg hover:bg-gray-50 transition-colors"
          >
            Find my skill-print
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-brand-700">Clareer<span className="text-accent-600">HQ</span></span>
            <span className="text-xs text-gray-400 mt-0.5">Your headquarters for clarity on your career.</span>
          </div>
          <span>
            Occupational data sourced from{' '}
            <a href="https://www.onetcenter.org" className="underline hover:text-brand-600" target="_blank" rel="noreferrer">
              O*NET Resource Center
            </a>
            , U.S. Department of Labor.
          </span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-brand-600">Privacy</a>
            <a href="/terms" className="hover:text-brand-600">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
