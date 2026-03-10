'use server';

import { db } from '@/lib/db';
import { prospects, interactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

type ProspectStatus = 'new' | 'message_generated' | 'sent' | 'replied' | 'converted' | 'discarded';

export async function updateProspectStatus(id: number, status: ProspectStatus) {
  await db
    .update(prospects)
    .set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(prospects.id, id));

  revalidatePath('/');
  revalidatePath(`/prospects/${id}`);
}

export async function addProspectNote(id: number, content: string) {
  await db.insert(interactions).values({
    prospectId: id,
    type: 'note',
    content,
  });

  revalidatePath(`/prospects/${id}`);
}

export async function discardProspect(id: number) {
  await db
    .update(prospects)
    .set({ status: 'discarded', updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(prospects.id, id));

  revalidatePath('/');
  revalidatePath(`/prospects/${id}`);
}
