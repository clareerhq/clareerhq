'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Target, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react';

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
      <div className="flex items-center gap-2 text-accent-600 font-semibold text-lg">
        <CheckCircle className="w-6 h-6" />
        You're on the list! We'll be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 rounded-xl bg-brand-700 text-white font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? 'Joining…' : 'Get Early Access'}
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
          <span className="text-xl font-bold text-brand-700">
            Clareer<span className="text-accent-600">HQ</span>
          </span>
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
            Know exactly where
            <br />
            <span className="text-brand-700">you fit</span> in the workforce
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Rate yourself across 300+ career dimensions. Get a precise fit score for any of
            1,000+ occupations — with a clear breakdown of your strengths and skill gaps.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/assess"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800 transition-colors"
            >
              Start your free assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '1,000+', label: 'Occupations' },
            { value: '300+', label: 'Career Dimensions' },
            { value: '$0', label: 'To Get Started' },
            { value: '10 min', label: 'Full Assessment' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-brand-700">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14 max-w-lg mx-auto">
            Three steps. Ten minutes. A career map built on real labor market data.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                step: '1',
                title: 'Pick a career to explore',
                desc: 'Search any of 1,000+ occupations from Data Scientist to Carpenter — or let us suggest careers based on your industry.',
              },
              {
                icon: BarChart3,
                step: '2',
                title: 'Rate your abilities honestly',
                desc: 'Score yourself 0–3 across Skills, Knowledge, Work Styles, and more. The more honest you are, the more accurate your results.',
              },
              {
                icon: TrendingUp,
                step: '3',
                title: 'Get your fit score',
                desc: 'See a precise match score, your top strengths, specific skill gaps, and alternative occupations where you fit even better.',
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

      {/* Feature highlights */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            Everything you need to navigate your career
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { title: 'Fit Score (0–100)', desc: 'A single number that summarises how well your profile matches an occupation, weighted by what matters most.' },
              { title: 'Domain Breakdown', desc: 'See how you score across Skills, Knowledge, Abilities, Work Styles, and more — not just one overall number.' },
              { title: 'Gap Analysis', desc: 'Pinpoint the exact skills and knowledge areas where you fall short — so you know exactly what to develop.' },
              { title: 'Alternative Careers', desc: 'Discover adjacent occupations where your existing skills are an even stronger fit.' },
              { title: 'O*NET Data', desc: 'Every comparison uses the U.S. Department of Labor\'s official occupational data — the same source trusted by career counselors nationwide.' },
              { title: 'Save & Track', desc: 'Revisit your assessments over time to see how your profile grows as you build new skills.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 p-4 rounded-xl bg-white border border-gray-100">
                <CheckCircle className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{f.title}</div>
                  <div className="text-gray-500 text-sm mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-brand-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to find your fit?</h2>
          <p className="text-brand-200 mb-8">
            Free forever for individual users. No credit card needed.
          </p>
          <Link
            href="/assess"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-lg hover:bg-gray-50 transition-colors"
          >
            Start your assessment
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-bold text-brand-700">Clareer<span className="text-accent-600">HQ</span></span>
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
