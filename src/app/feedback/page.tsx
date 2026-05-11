'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { MessageSquare, Bug, Lightbulb, MoreHorizontal, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

type FeedbackType = 'GENERAL' | 'BUG' | 'FEATURE' | 'OTHER';

const TYPES: { value: FeedbackType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'GENERAL', label: 'General',     icon: <MessageSquare className="w-4 h-4" />, desc: 'Something on your mind' },
  { value: 'BUG',     label: 'Bug',         icon: <Bug           className="w-4 h-4" />, desc: 'Something is broken' },
  { value: 'FEATURE', label: 'Feature idea',icon: <Lightbulb     className="w-4 h-4" />, desc: 'Something we should build' },
  { value: 'OTHER',   label: 'Other',       icon: <MoreHorizontal className="w-4 h-4" />, desc: 'Anything else' },
];

export default function FeedbackPage() {
  const { isSignedIn } = useAuth();

  const [type, setType]               = useState<FeedbackType>('GENERAL');
  const [message, setMessage]         = useState('');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [feedbackArmy, setFeedbackArmy] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { setError('Please share your thoughts first.'); return; }
    if (feedbackArmy && !email.trim()) { setError('We need your email to add you to the Feedback Army.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          feedbackArmy,
          page: typeof window !== 'undefined' ? document.referrer : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong. Please try again.'); return; }
      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Got it — thank you.</h2>
          <p className="text-gray-500 text-sm mb-2">
            {feedbackArmy
              ? "You're in the Feedback Army. Chelsey will be in touch personally when new things ship."
              : 'Your feedback goes directly to Chelsey. It will be read.'}
          </p>
          {feedbackArmy && (
            <p className="text-xs text-brand-600 font-semibold mb-6">🪖 Check your inbox for a confirmation.</p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Back to home
            </Link>
            <button
              onClick={() => { setSubmitted(false); setMessage(''); setFeedbackArmy(false); }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Send more feedback
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/logo.svg" alt="Skill-Print" className="h-6 w-auto" />
          </Link>
          {isSignedIn && (
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-brand-700 transition-colors">
              Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Share your thoughts</h1>
          <p className="text-gray-500 text-sm">
            This goes directly to Chelsey. Not a ticket queue, not a bot — a founder who reads every message.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              What kind of feedback?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all ${
                    type === t.value
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={type === t.value ? 'text-brand-600' : 'text-gray-400'}>{t.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs text-gray-400">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Your message <span className="text-red-400">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={
                type === 'BUG'     ? "What happened? What did you expect to happen? What page were you on?" :
                type === 'FEATURE' ? "What would you love to see? What problem would it solve for you?" :
                "Tell us anything. Brutal honesty welcome."
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Optional identity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Name <span className="text-gray-300 font-normal normal-case">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Email {feedbackArmy && <span className="text-red-400">*</span>}
                {!feedbackArmy && <span className="text-gray-300 font-normal normal-case"> (optional)</span>}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Feedback Army opt-in */}
          <div
            className={`rounded-2xl border-2 p-5 transition-all cursor-pointer ${
              feedbackArmy
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setFeedbackArmy(!feedbackArmy)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                feedbackArmy ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'
              }`}>
                {feedbackArmy && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">Join the Feedback Army</span>
                  <span className="text-base">🪖</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Get a personal email from Chelsey when new features ship. You'll be the first to try
                  new things and your opinion will actually shape what gets built. Small list. No spam.
                  Just a founder asking for honest input.
                </p>
                {feedbackArmy && !email && (
                  <p className="text-xs text-amber-700 font-semibold mt-2">
                    ↑ Add your email above so we can reach you.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              'Send feedback'
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Anonymous submissions are welcome. Your email is never shared.
          </p>
        </form>
      </div>
    </div>
  );
}
