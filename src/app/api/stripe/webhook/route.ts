// POST /api/stripe/webhook
// Handles Stripe events to keep the Prisma User table in sync with billing state.
//
// Events handled:
//   checkout.session.completed       → fulfil one-time report purchase or new subscription
//   customer.subscription.updated    → plan renewal / upgrade / downgrade
//   customer.subscription.deleted    → subscription cancelled / expired → revert to FREE
//   invoice.payment_failed           → optional: could flag account for dunning

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyUserUpdate = any; // Prisma types will auto-correct after `npx prisma generate`

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── One-time payment OR new subscription checkout completed ─────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const priceKey = session.metadata?.priceKey;
        if (!clerkId) break;

        if (session.mode === 'payment' && priceKey === 'REPORT_ONE_TIME') {
          // $10 one-time report — mark reportPurchased, upgrade to PRO
          await db.user.update({
            where: { id: clerkId },
            data: {
              plan: 'PRO',
              reportPurchased: true,
              stripeId: session.customer as string,
            } as AnyUserUpdate,
          });
          console.log(`[stripe/webhook] Report purchased: ${clerkId}`);
        }

        if (session.mode === 'subscription') {
          // $10/month — handled more fully by customer.subscription.updated below
          // but set plan immediately for good UX
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await db.user.update({
            where: { id: clerkId },
            data: {
              plan: 'PRO',
              stripeId: session.customer as string,
              stripeSubId: sub.id,
              planExpiresAt: new Date(sub.current_period_end * 1000),
            } as AnyUserUpdate,
          });
          console.log(`[stripe/webhook] Subscription started: ${clerkId}`);
        }
        break;
      }

      // ── Subscription renewed, upgraded, or changed ──────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        if (!clerkId) break;

        const isActive = ['active', 'trialing'].includes(sub.status);
        await db.user.update({
          where: { id: clerkId },
          data: {
            plan: isActive ? 'PRO' : 'FREE',
            stripeSubId: isActive ? sub.id : null,
            planExpiresAt: isActive ? new Date(sub.current_period_end * 1000) : null,
          } as AnyUserUpdate,
        });
        console.log(`[stripe/webhook] Subscription updated: ${clerkId} → ${isActive ? 'PRO' : 'FREE'}`);
        break;
      }

      // ── Subscription cancelled or expired ───────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        if (!clerkId) break;

        // Revert to FREE but preserve reportPurchased if they bought the one-time report
        await db.user.update({
          where: { id: clerkId },
          data: {
            plan: 'FREE',
            stripeSubId: null,
            planExpiresAt: null,
          } as AnyUserUpdate,
        });
        console.log(`[stripe/webhook] Subscription cancelled: ${clerkId}`);
        break;
      }

      default:
        // Acknowledge but ignore other events
        break;
    }
  } catch (err) {
    console.error('[stripe/webhook] Handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
