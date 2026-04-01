// POST /api/webhooks/clerk
// Handles Clerk user.created and user.updated events to keep Prisma User table
// in sync with real email addresses (replacing the placeholder emails written
// when an assessment is first saved before the user email is available).

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// ── Svix signature verification (no external package required) ───────────────
// Clerk signs webhooks via Svix: https://docs.svix.com/receiving/verifying-payloads/how
//
// Signed string: "{msg-id}.{timestamp}.{body}"
// Signature header: "v1,<base64(HMAC-SHA256(signed, secret_bytes))>"
// Secret format: "whsec_<base64-encoded-key>"

function verifyWebhookSignature(
  body: string,
  headers: Headers,
  secret: string
): boolean {
  const msgId = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const sigHeader = headers.get('svix-signature');

  if (!msgId || !timestamp || !sigHeader) return false;

  // Reject messages older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) return false;

  // Decode the base64 key (strip "whsec_" prefix)
  const rawSecret = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');

  const toSign = `${msgId}.${timestamp}.${body}`;
  const expectedSig = createHmac('sha256', rawSecret)
    .update(toSign)
    .digest('base64');

  // sigHeader may contain multiple signatures: "v1,sig1 v1,sig2"
  const signatures = sigHeader.split(' ').map((s) => s.replace(/^v1,/, ''));
  return signatures.some((sig) => {
    try {
      return timingSafeEqual(Buffer.from(sig, 'base64'), Buffer.from(expectedSig, 'base64'));
    } catch {
      return false;
    }
  });
}

// ── Clerk event types we care about ─────────────────────────────────────────

interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification?: { status: string };
}

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | string;
  data: {
    id: string;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
  };
}

function getPrimaryEmail(data: ClerkUserEvent['data']): string | null {
  const { email_addresses, primary_email_address_id } = data;
  if (!email_addresses?.length) return null;

  // Prefer the explicitly-marked primary address
  if (primary_email_address_id) {
    const primary = email_addresses.find((e) => e.id === primary_email_address_id);
    if (primary?.email_address) return primary.email_address;
  }

  // Fall back to first verified address, then first address overall
  const verified = email_addresses.find((e) => e.verification?.status === 'verified');
  return (verified ?? email_addresses[0])?.email_address ?? null;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[clerk/webhook] CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();

  if (!verifyWebhookSignature(body, req.headers, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event: ClerkUserEvent = JSON.parse(body);

  if (event.type !== 'user.created' && event.type !== 'user.updated') {
    // We only care about user lifecycle events; return 200 to acknowledge
    return NextResponse.json({ received: true });
  }

  const userId = event.data.id;
  const email = getPrimaryEmail(event.data);

  if (!userId || !email) {
    console.warn('[clerk/webhook] Missing userId or email in event', event.type);
    return NextResponse.json({ received: true });
  }

  try {
    await db.user.upsert({
      where: { id: userId },
      update: { email },
      create: {
        id: userId,
        email,
        plan: 'FREE',
      },
    });

    console.log(`[clerk/webhook] Synced user ${userId} → ${email}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[clerk/webhook] DB upsert failed:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
