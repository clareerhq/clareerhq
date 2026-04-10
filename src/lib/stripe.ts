// ─────────────────────────────────────────────────────────────────────────────
//  Stripe client — singleton, server-side only
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// ── Price IDs ─────────────────────────────────────────────────────────────────
// Set these in your Stripe dashboard and add to Vercel env vars.
// One-time: $10 full 8-domain skill-print report
// Subscription: $10/month Pro (unlimited job specs + early access)

export const PRICES = {
  REPORT_ONE_TIME: process.env.STRIPE_REPORT_PRICE_ID ?? '',   // $10 one-time
  PRO_MONTHLY:     process.env.STRIPE_PRO_PRICE_ID ?? '',       // $10/month
} as const;

export type PriceKey = keyof typeof PRICES;

// ── Plan helpers ──────────────────────────────────────────────────────────────

export const PLAN_NAMES: Record<PriceKey, string> = {
  REPORT_ONE_TIME: 'Skill-Print Report',
  PRO_MONTHLY:     'Pro',
};

export const PLAN_DESCRIPTIONS: Record<PriceKey, string> = {
  REPORT_ONE_TIME: 'Full 8-domain skill-print report — yours to keep.',
  PRO_MONTHLY:     'Unlimited job specs, resume sections, and early access to new features.',
};
