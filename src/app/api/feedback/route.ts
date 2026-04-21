// POST /api/feedback — Save feedback + notify Chelsey via Resend

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

const FeedbackSchema = z.object({
  type: z.enum(['GENERAL', 'BUG', 'FEATURE', 'OTHER']).default('GENERAL'),
  message: z.string().min(1, 'Message is required').max(5000),
  name: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  feedbackArmy: z.boolean().default(false),
  page: z.string().max(200).optional(),
});

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'General feedback',
  BUG:     'Bug report',
  FEATURE: 'Feature idea',
  OTHER:   'Other',
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = FeedbackSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.errors[0]?.message ?? 'Invalid input' },
      { status: 422 }
    );
  }

  const { type, message, name, email, feedbackArmy, page } = parse.data;

  // Get Clerk user ID if logged in (non-fatal if auth fails)
  let userId: string | null = null;
  try {
    const { userId: uid } = await auth();
    userId = uid;
  } catch {}

  // Save to DB
  let feedback;
  try {
    feedback = await db.feedback.create({
      data: {
        type,
        message,
        name: name || null,
        email: email || null,
        feedbackArmy,
        userId,
        page: page || null,
      },
    });
  } catch (err) {
    console.error('[feedback] db error:', err);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }

  // Email notification to Chelsey
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const armyBadge = feedbackArmy ? '🪖 <strong>FEEDBACK ARMY OPT-IN</strong><br/>' : '';
      const fromName = name ? name : (userId ? 'Logged-in user' : 'Anonymous');
      const fromEmail = email ? ` &lt;${email}&gt;` : '';

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'hello@clareerhq.com',
        to: 'chelseygoverprice@gmail.com',
        subject: `[ClareerHQ Feedback] ${TYPE_LABELS[type]} from ${fromName}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#1e40af;margin:0 0 4px">New ${TYPE_LABELS[type]}</h2>
            <p style="color:#6b7280;font-size:13px;margin:0 0 24px">
              ${armyBadge}
              <strong>From:</strong> ${fromName}${fromEmail}<br/>
              ${userId ? `<strong>User ID:</strong> ${userId}<br/>` : ''}
              ${page ? `<strong>Page:</strong> ${page}<br/>` : ''}
              <strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT
            </p>
            <div style="background:#f8fafc;border-left:4px solid #1e40af;padding:16px 20px;border-radius:4px;margin-bottom:24px">
              <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
            ${feedbackArmy && email ? `
            <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:16px">
              <strong style="color:#92400e">🪖 Feedback Army member</strong>
              <p style="margin:4px 0 0;color:#78350f;font-size:13px">Reply to this email to reach them at ${email}</p>
            </div>` : ''}
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
            <p style="color:#9ca3af;font-size:11px;margin:0">ClareerHQ · Feedback ID: ${feedback.id}</p>
          </div>
        `,
      });

      // If Feedback Army, also send a confirmation to the user
      if (feedbackArmy && email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'hello@clareerhq.com',
          to: email,
          subject: "You're in the Feedback Army 🪖",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
              <h2 style="color:#1e40af">Welcome to the Feedback Army${name ? `, ${name}` : ''}!</h2>
              <p>You're officially in. I'll reach out personally when new features ship — your opinion will actually influence what gets built next.</p>
              <p style="color:#6b7280;font-size:13px">This is a small, real list. No spam. Just a founder asking for honest input.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#9ca3af;font-size:12px">— Chelsey, Founder @ ClareerHQ<br/>Reply anytime.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      // Non-fatal — feedback already saved to DB
      console.error('[feedback] email send failed:', emailErr);
    }
  }

  return NextResponse.json({ success: true, id: feedback.id });
}
