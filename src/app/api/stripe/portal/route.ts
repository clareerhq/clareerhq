// POST /api/stripe/portal
// Opens the Stripe Customer Portal so users can manage/cancel their subscription.
// Returns: { url: string }

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clareerhq.com';

export async function POST(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.stripeId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeId,
    return_url: `${APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
