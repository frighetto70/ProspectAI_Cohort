import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProspectById, getAdjacentProspectIds } from '@/lib/services/prospect.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageGenerator } from '@/components/messages/message-generator';
import { InteractionTimeline } from '@/components/interaction-timeline';
import { QuickActions } from '@/components/prospects/quick-actions';

type PageParams = { params: Promise<{ id: string }> };

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  message_generated: 'bg-purple-100 text-purple-800',
  sent: 'bg-yellow-100 text-yellow-800',
  replied: 'bg-green-100 text-green-800',
  converted: 'bg-emerald-100 text-emerald-800',
  discarded: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  new: 'Novo',
  message_generated: 'Mensagem Gerada',
  sent: 'Enviado',
  replied: 'Respondido',
  converted: 'Convertido',
  discarded: 'Descartado',
};

export default async function ProspectDetailPage({ params }: PageParams) {
  const { id } = await params;
  const numId = Number(id);
  const [prospect, adjacent] = await Promise.all([
    getProspectById(numId),
    getAdjacentProspectIds(numId),
  ]);

  if (!prospect) {
    notFound();
  }

  const { interactions, ...prospectData } = prospect;

  return (
    <div>
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Pipeline
            </Button>
          </Link>
          {adjacent.prevId && (
            <Link href={`/prospects/${adjacent.prevId}`}>
              <Button variant="outline" size="sm">
                ← Anterior
              </Button>
            </Link>
          )}
          {adjacent.nextId && (
            <Link href={`/prospects/${adjacent.nextId}`}>
              <Button variant="outline" size="sm">
                Próximo →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {prospect.company || 'Empresa desconhecida'}
          </h1>
          <Badge variant="secondary" className={statusColors[prospect.status] || ''}>
            {statusLabels[prospect.status] || prospect.status}
          </Badge>
        </div>
        <p className="text-lg text-gray-600 mt-1">
          {[prospect.name, prospect.title].filter(Boolean).join(' — ')}
        </p>
        {prospect.headline && (
          <p className="text-gray-500 italic mt-1">{prospect.headline}</p>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <QuickActions prospectId={numId} currentStatus={prospect.status} />
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Setor" value={prospect.industry} />
            <InfoRow label="Localização" value={prospect.location} />
            <InfoRow label="Captura" value={
              prospect.createdAt
                ? new Date(prospect.createdAt).toLocaleDateString('pt-BR')
                : null
            } />
            {prospect.linkedinUrl && (
              <div>
                <span className="text-gray-500 text-xs">LinkedIn</span>
                <div>
                  <a
                    href={prospect.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1e3a5f] hover:underline text-sm"
                  >
                    Ver perfil no LinkedIn →
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            {prospect.summary ? (
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{prospect.summary}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">Nenhum resumo disponível.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Generator */}
      <div id="message-generator" className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Gerador de Mensagem</h2>
        <MessageGenerator prospect={prospectData} />
      </div>

      {/* Interaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Interações</CardTitle>
        </CardHeader>
        <CardContent>
          <InteractionTimeline interactions={interactions} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-gray-500 text-xs">{label}</span>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}
