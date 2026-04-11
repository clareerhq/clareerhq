'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <img src="/logo.svg" alt="ClareerHQ" className="h-9 w-auto" />
            <span className="text-[10px] text-gray-400 font-medium tracking-wide hidden sm:block mt-0.5">
              Your HQ for career clarity
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-gray-500 hover:text-brand-700 transition-colors">
              Sign in
            </Link>
            <Link href="/assess" className="px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors">
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-accent-600 uppercase tracking-widest mb-8">
            Free · No credit card · 10 minutes
          </p>
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black text-gray-900 leading-none mb-6 tracking-tight">
            Your<br />
            <span className="text-brand-700">Skill-Print.</span>
          </h1>
          <p className="text-2xl sm:text-3xl text-gray-500 mb-12 max-w-xl mx-auto leading-snug">
            The new resume section that proves what you can do.
          </p>
          <Link
            href="/assess"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-brand-700 text-white font-bold text-xl hover:bg-brand-800 transition-colors shadow-lg"
          >
            Build mine free
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Resume concept */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Resumes have a new section.
          </h2>
          <p className="text-xl text-gray-500">
            Summary.{' '}
            <span className="font-black text-brand-700">Skill-Print.</span>{' '}
            Experience. Education.
          </p>
        </div>

        {/* Resume mockup */}
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Summary — greyed out */}
          <div className="px-8 py-5 border-b border-gray-100 opacity-25">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Summary</div>
            <div className="space-y-2">
              <div className="h-2.5 bg-gray-200 rounded-full w-full" />
              <div className="h-2.5 bg-gray-200 rounded-full w-4/5" />
              <div className="h-2.5 bg-gray-200 rounded-full w-3/5" />
            </div>
          </div>

          {/* Skill-Print — highlighted */}
          <div className="px-8 py-7 bg-brand-50 border-b-2 border-brand-200">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-700">Skill-Print</span>
              <span className="text-[10px] bg-brand-700 text-white px-2 py-0.5 rounded-full font-bold">NEW</span>
            </div>
            <div className="text-xs font-bold text-gray-700 mb-4">Target Role: Product Manager</div>
            <div className="space-y-3">
              {[
                { label: 'Skills', pct: 87 },
                { label: 'Knowledge', pct: 74 },
                { label: 'Work Style', pct: 91 },
              ].map(({ label, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500">{label}</div>
                  <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-brand-100">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-8 text-xs font-black text-brand-700 text-right">{pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience + Education — greyed out */}
          <div className="px-8 py-5 opacity-25">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Experience</div>
            <div className="space-y-2 mb-5">
              <div className="h-2.5 bg-gray-200 rounded-full w-5/6" />
              <div className="h-2.5 bg-gray-200 rounded-full w-2/3" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Education</div>
            <div className="h-2.5 bg-gray-200 rounded-full w-1/2" />
          </div>
        </div>
      </section>

      {/* Free vs Pro */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black text-center text-gray-900 mb-12">
            Free. Then more.
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Free */}
            <div className="p-8 rounded-2xl border-2 border-brand-200 bg-brand-50">
              <div className="text-4xl font-black text-brand-700 mb-1">$0</div>
              <div className="text-gray-500 font-medium mb-7">Free forever.</div>
              <ul className="space-y-3 mb-8">
                {[
                  'Any job title (1,000+ careers)',
                  'Skills, knowledge & work style assessment',
                  'Your Skill-Print score',
                  'Resume-ready Skill-Print section',
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="text-brand-600 font-black mt-0.5 flex-shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
              <Link
                href="/assess"
                className="block text-center py-3.5 px-6 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
              >
                Start free →
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl border-2 border-gray-200 bg-white">
              <div className="text-4xl font-black text-gray-900 mb-1">Pro</div>
              <div className="text-gray-500 font-medium mb-7">From $10.</div>
              <ul className="space-y-3 mb-8">
                {[
                  'Full 8-domain Skill-Print report',
                  'Printable PDF you can attach anywhere',
                  'Job posting gap analysis',
                  'Unlimited role comparisons',
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="text-gray-400 font-black mt-0.5 flex-shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
              <Link
                href="/upgrade"
                className="block text-center py-3.5 px-6 rounded-xl border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-50 transition-colors"
              >
                See pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-14">
            10 minutes. That's it.
          </h2>
          <div className="grid sm:grid-cols-3 gap-10 text-left">
            {[
              { n: '1', title: 'Pick a job title', sub: 'Any of 1,000+ O*NET careers.' },
              { n: '2', title: 'Rate yourself', sub: 'Skills. Knowledge. Work style.' },
              { n: '3', title: 'Get your Skill-Print', sub: 'Resume-ready. Evidence-based.' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex gap-4 items-start">
                <div className="text-6xl font-black text-brand-100 leading-none select-none flex-shrink-0">{n}</div>
                <div className="pt-1">
                  <div className="font-bold text-gray-900 text-xl leading-tight">{title}</div>
                  <div className="text-gray-500 mt-1">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-28 px-6 bg-brand-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl sm:text-6xl font-black mb-5 leading-tight">
            Your Skill-Print<br />is waiting.
          </h2>
          <p className="text-brand-200 text-xl mb-12">Free. Role-specific. Resume-ready.</p>
          <Link
            href="/assess"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-brand-700 font-bold text-xl hover:bg-gray-50 transition-colors"
          >
            Build mine free
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex flex-col leading-tight">
            <img src="/logo.svg" alt="ClareerHQ" className="h-6 w-auto" />
            <span className="text-xs text-gray-400 mt-1">Your HQ for career clarity.</span>
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
