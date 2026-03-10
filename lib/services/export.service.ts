import { db } from '@/lib/db';
import { prospects, interactions } from '@/lib/db/schema';
import { sql, and, or, like, eq, desc } from 'drizzle-orm';

type ExportFilters = {
  status?: string;
  search?: string;
};

export async function exportProspectsCSV(filters: ExportFilters = {}): Promise<string> {
  const { status, search } = filters;
  const conditions = [];

  if (status && status !== 'all') {
    conditions.push(eq(prospects.status, status as 'new'));
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

  const data = await db
    .select()
    .from(prospects)
    .where(where)
    .orderBy(desc(prospects.createdAt));

  // Get last interaction for each prospect
  const prospectIds = data.map((p) => p.id);
  const allInteractions = prospectIds.length > 0
    ? await db
        .select()
        .from(interactions)
        .where(sql`prospect_id IN (${sql.join(prospectIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(desc(interactions.createdAt))
    : [];

  const lastInteractionMap = new Map<number, string>();
  for (const interaction of allInteractions) {
    if (!lastInteractionMap.has(interaction.prospectId)) {
      lastInteractionMap.set(interaction.prospectId, interaction.content);
    }
  }

  // Build CSV
  const headers = ['Nome', 'Cargo', 'Empresa', 'Setor', 'LinkedIn URL', 'Status', 'Última Mensagem', 'Data de Captura'];
  const rows = data.map((p) => [
    escapeCSV(p.name),
    escapeCSV(p.title || ''),
    escapeCSV(p.company || ''),
    escapeCSV(p.industry || ''),
    escapeCSV(p.linkedinUrl || ''),
    escapeCSV(p.status),
    escapeCSV(lastInteractionMap.get(p.id) || ''),
    escapeCSV(p.createdAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
