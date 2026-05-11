// POST /api/waitlist — Add email to waitlist + send welcome email via Resend

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const WaitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = WaitlistSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 });
  }

  const { email, name, source } = parse.data;

  try {
    const entry = await db.waitlistEntry.upsert({
      where: { email },
      update: {},
      create: { email, name, source },
    });

    // Send welcome email via Resend (only if env is set)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'clareerhq@gmail.com',
          to: email,
          subject: "You're on the Skill-Print waitlist! 🎯",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
              <h2 style="color:#1B4F72">Welcome to Skill-Print${name ? `, ${name}` : ''}!</h2>
              <p>You're on the list. We'll reach out the moment early access opens.</p>
              <p style="color:#148F77;font-weight:600">
                Skill-Print maps your real strengths to the careers that fit — using the same data that powers career counsellors and HR systems nationwide.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#888;font-size:13px">
                Questions? Just reply to this email.<br/>
                — Chelsey & the Skill-Print team
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Non-fatal — waitlist entry already saved
        console.error('[waitlist] email send failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true, id: entry.id });
  } catch (err: unknown) {
    // Handle duplicate email gracefully
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: true, duplicate: true });
    }
    console.error('[waitlist]', err);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}
