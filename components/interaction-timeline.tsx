'use client';

import { Badge } from '@/components/ui/badge';
import type { Interaction } from '@/lib/db/schema';

const typeLabels: Record<string, string> = {
  message_generated: 'Mensagem Gerada',
  message_sent: 'Mensagem Enviada',
  reply: 'Resposta',
  note: 'Nota',
};

const typeColors: Record<string, string> = {
  message_generated: 'bg-purple-100 text-purple-800',
  message_sent: 'bg-yellow-100 text-yellow-800',
  reply: 'bg-green-100 text-green-800',
  note: 'bg-gray-100 text-gray-600',
};

export function InteractionTimeline({ interactions }: { interactions: Interaction[] }) {
  if (interactions.length === 0) {
    return (
      <p className="text-gray-400 text-sm italic">
        Nenhuma interação registrada. Gere uma mensagem para iniciar o contato.
      </p>
    );
  }

  const sorted = [...interactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-3">
      {sorted.map((interaction) => (
        <div key={interaction.id} className="border-l-2 border-gray-200 pl-4 py-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={typeColors[interaction.type] || ''}>
              {typeLabels[interaction.type] || interaction.type}
            </Badge>
            <span className="text-xs text-gray-400">
              {new Date(interaction.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{interaction.content}</p>
        </div>
      ))}
    </div>
  );
}
