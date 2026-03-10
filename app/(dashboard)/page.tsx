import { Suspense } from 'react';
import { listProspects } from '@/lib/services/prospect.service';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { SearchFilters } from '@/components/prospects/search-filters';
import { MetricsBar } from '@/components/metrics-bar';
import { db } from '@/lib/db';
import { prospects, interactions } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function getMetrics() {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects);

  const statusCounts = await db
    .select({ status: prospects.status, count: sql<number>`count(*)` })
    .from(prospects)
    .groupBy(prospects.status);

  const byStatus: Record<string, number> = {
    new: 0, message_generated: 0, sent: 0, replied: 0, converted: 0, discarded: 0,
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

  return {
    total,
    byStatus,
    responseRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    conversionRate: total > 0 ? Math.round((byStatus.converted / total) * 100) : 0,
    messagesSent: messagesSentResult.count,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;

  const [{ data: allProspects, total }, metrics] = await Promise.all([
    listProspects({ search, pageSize: 500 }),
    getMetrics(),
  ]);

  const exportParams = new URLSearchParams();
  if (search) exportParams.set('search', search);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} prospect{total !== 1 ? 's' : ''} no pipeline
          </p>
        </div>
        <a
          href={`/api/export/csv${exportParams.toString() ? `?${exportParams.toString()}` : ''}`}
          className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Exportar CSV
        </a>
      </div>

      <MetricsBar metrics={metrics} />

      <Suspense fallback={null}>
        <SearchFilters />
      </Suspense>

      <div className="mt-4">
        <KanbanBoard initialProspects={allProspects} />
      </div>
    </div>
  );
}
