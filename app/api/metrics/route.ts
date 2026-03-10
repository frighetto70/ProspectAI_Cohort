import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, interactions } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET() {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects);

  const statusCounts = await db
    .select({
      status: prospects.status,
      count: sql<number>`count(*)`,
    })
    .from(prospects)
    .groupBy(prospects.status);

  const byStatus: Record<string, number> = {
    new: 0,
    message_generated: 0,
    sent: 0,
    replied: 0,
    converted: 0,
    discarded: 0,
  };
  for (const row of statusCounts) {
    byStatus[row.status] = row.count;
  }

  const [messagesSentResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(interactions)
    .where(eq(interactions.type, 'message_sent'));

  const total = totalResult.count;
  const sent = byStatus.sent + byStatus.replied + byStatus.converted;
  const replied = byStatus.replied + byStatus.converted;
  const responseRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;
  const conversionRate = total > 0 ? Math.round((byStatus.converted / total) * 100) : 0;

  return NextResponse.json({
    total,
    byStatus,
    responseRate,
    conversionRate,
    messagesSent: messagesSentResult.count,
  });
}
