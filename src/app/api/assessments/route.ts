// POST /api/assessments — Save a completed assessment
// GET  /api/assessments — List assessments for current user

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { computeFitScore } from '@/lib/scoring';
import { z } from 'zod';
import type { AssessmentDomain } from '@/types/onet';

export const runtime = 'nodejs';

const RatedElementSchema = z.object({
  elementId: z.string(),
  elementName: z.string(),
  rating: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  onetImportance: z.number(),
  onetLevel: z.number(),
});

const DomainRatingsSchema = z.object({
  domain: z.string() as z.ZodType<AssessmentDomain>,
  elements: z.array(RatedElementSchema),
});

const SaveAssessmentSchema = z.object({
  occupationCode: z.string(),
  occupationTitle: z.string(),
  ratings: z.array(DomainRatingsSchema),
});

// ── POST: Save new assessment ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parse = SaveAssessmentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 422 });
  }

  const { occupationCode, occupationTitle, ratings } = parse.data;

  // Compute fit score
  const result = computeFitScore(ratings, occupationCode, occupationTitle);

  // Upsert user record (Clerk handles auth, we sync on first save)
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@clerk.placeholder` }, // email updated via webhook
  });

  // Save assessment + ratings in a transaction
  const assessment = await db.$transaction(async (tx) => {
    const a = await tx.assessment.create({
      data: {
        userId,
        occupationCode,
        occupationTitle,
        fitScore: result.fitScore,
        domainScores: result.domainScores,
        ratings: {
          create: ratings.flatMap((dr) =>
            dr.elements.map((el) => ({
              domain: dr.domain,
              elementId: el.elementId,
              elementName: el.elementName,
              rating: el.rating,
              onetLevel: el.onetLevel,
              onetImportance: el.onetImportance,
            }))
          ),
        },
        gapItems: {
          create: [
            ...result.gaps.map((g) => ({
              elementId: g.elementId,
              elementName: g.elementName,
              domain: 'gap',
              userRating: g.rating,
              requiredLevel: g.onetLevel,
              importance: g.onetImportance,
              isStrength: false,
            })),
            ...result.strengths.map((s) => ({
              elementId: s.elementId,
              elementName: s.elementName,
              domain: 'strength',
              userRating: s.rating,
              requiredLevel: s.onetLevel,
              importance: s.onetImportance,
              isStrength: true,
            })),
          ],
        },
      },
      include: { ratings: true, gapItems: true },
    });
    return a;
  });

  return NextResponse.json({ assessmentId: assessment.id, fitScore: result.fitScore, result });
}

// ── GET: List assessments ─────────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assessments = await db.assessment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      occupationCode: true,
      occupationTitle: true,
      fitScore: true,
      createdAt: true,
    },
  });

  return NextResponse.json(assessments);
}
