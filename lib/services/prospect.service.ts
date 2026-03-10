import { db } from '@/lib/db';
import { prospects, interactions, type NewProspect } from '@/lib/db/schema';
import { eq, like, sql, and, or } from 'drizzle-orm';

type ProspectStatus = 'new' | 'message_generated' | 'sent' | 'replied' | 'converted' | 'discarded';

export type ProspectFilters = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listProspects(filters: ProspectFilters = {}) {
  const { status, search, page = 1, pageSize = 20 } = filters;
  const conditions = [];

  if (status && status !== 'all') {
    conditions.push(eq(prospects.status, status as ProspectStatus));
  }

  if (search) {
    conditions.push(
      or(
        like(prospects.name, `%${search}%`),
        like(prospects.company, `%${search}%`),
        like(prospects.title, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(prospects)
      .where(where)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(prospects.createdAt),
    db
      .select({ count: sql<number>`count(*)` })
      .from(prospects)
      .where(where),
  ]);

  return { data, total: countResult[0].count };
}

export async function getProspectById(id: number) {
  const prospect = await db.query.prospects.findFirst({
    where: eq(prospects.id, id),
  });
  if (!prospect) return null;

  const prospectInteractions = await db
    .select()
    .from(interactions)
    .where(eq(interactions.prospectId, id))
    .orderBy(interactions.createdAt);

  return { ...prospect, interactions: prospectInteractions };
}

export async function createProspect(data: NewProspect) {
  const result = await db.insert(prospects).values(data).returning();
  return result[0];
}

export async function updateProspect(id: number, data: Partial<NewProspect>) {
  const result = await db
    .update(prospects)
    .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(prospects.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deleteProspect(id: number) {
  await db.delete(prospects).where(eq(prospects.id, id));
  return { deleted: true };
}

export async function getAdjacentProspectIds(id: number) {
  const [prev] = await db
    .select({ id: prospects.id })
    .from(prospects)
    .where(sql`id < ${id}`)
    .orderBy(sql`id DESC`)
    .limit(1);

  const [next] = await db
    .select({ id: prospects.id })
    .from(prospects)
    .where(sql`id > ${id}`)
    .orderBy(sql`id ASC`)
    .limit(1);

  return { prevId: prev?.id ?? null, nextId: next?.id ?? null };
}
