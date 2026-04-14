import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ authenticated: false, reportPurchased: false, plan: 'FREE' });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true, reportPurchased: true },
    });

    if (!user) {
      return NextResponse.json({ authenticated: true, reportPurchased: false, plan: 'FREE' });
    }

    return NextResponse.json({
      authenticated: true,
      reportPurchased: user.reportPurchased,
      plan: user.plan,
    });
  } catch {
    return NextResponse.json({ authenticated: true, reportPurchased: false, plan: 'FREE' });
  }
}
