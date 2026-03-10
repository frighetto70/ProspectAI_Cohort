import { Card, CardContent } from '@/components/ui/card';

type Metrics = {
  total: number;
  responseRate: number;
  conversionRate: number;
  messagesSent: number;
  byStatus: Record<string, number>;
};

export function MetricsBar({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: 'Total Prospects', value: metrics.total, color: 'text-gray-900' },
    { label: 'Taxa de Resposta', value: `${metrics.responseRate}%`, color: 'text-green-600' },
    { label: 'Conversões', value: metrics.byStatus.converted || 0, color: 'text-[#1e3a5f]' },
    { label: 'Msgs Enviadas', value: metrics.messagesSent, color: 'text-yellow-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
