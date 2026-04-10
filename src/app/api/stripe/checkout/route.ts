// POST /api/stripe/checkout
// Creates a Stripe Checkout session for either:
//   - $10 one-time skill-print report   (mode: payment)
//   - $10/month Pro subscription        (mode: subscription)
//
// Body: { priceKey: 'REPORT_ONE_TIME' | 'PRO_MONTHLY' }
// Returns: { url: string } — redirect the user to this URL

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, PRICES } from '@/lib/stripe';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clareerhq.com';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const priceKey = body.priceKey as keyof typeof PRICES;

  if (!PRICES[priceKey]) {
    return NextResponse.json({ error: 'Invalid price key' }, { status: 400 });
  }

  const priceId = PRICES[priceKey];
  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID for ${priceKey} is not configured. Add it to your Vercel env vars.` },
      { status: 500 }
    );
  }

  // Get or create the Stripe customer for this user
  let user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    // Shouldn't happen after Clerk webhook is wired, but handle gracefully
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let customerId = user.stripeId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { clerkId: userId },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: userId },
      data: { stripeId: customerId },
    });
  }

  const isSubscription = priceKey === 'PRO_MONTHLY';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/upgrade/cancel`,
    metadata: { clerkId: userId, priceKey },
    ...(isSubscription && {
      subscription_data: { metadata: { clerkId: userId } },
    }),
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
