'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageEditor } from './message-editor';
import { TemplateSelector } from './template-selector';
import type { Prospect } from '@/lib/db/schema';

type MessageGeneratorProps = {
  prospect: Prospect;
  onMessageGenerated?: () => void;
};

export function MessageGenerator({ prospect, onMessageGenerated }: MessageGeneratorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [customContext, setCustomContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    model: string;
    tokensUsed: number;
    generationTimeMs: number;
  } | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/prospects/${prospect.id}/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          customContext: customContext || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Erro ao gerar mensagem');
      }

      const data = await res.json();
      setGeneratedMessage(data.content);
      setMetadata(data.metadata);
      onMessageGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Prospect Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfil do Prospect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Nome" value={prospect.name} />
          <InfoRow label="Cargo" value={prospect.title} />
          <InfoRow label="Empresa" value={prospect.company} />
          <InfoRow label="Setor" value={prospect.industry} />
          <InfoRow label="Headline" value={prospect.headline} />
          {prospect.summary && (
            <div>
              <span className="font-medium text-gray-500">Resumo</span>
              <p className="text-gray-700 mt-1">{prospect.summary}</p>
            </div>
          )}
          {prospect.linkedinUrl && (
            <a
              href={prospect.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1e3a5f] hover:underline text-xs"
            >
              Ver no LinkedIn →
            </a>
          )}
        </CardContent>
      </Card>

      {/* Right: Message Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gerar Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <TemplateSelector value={selectedTemplateId} onChange={setSelectedTemplateId} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contexto adicional (opcional)
            </label>
            <input
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              placeholder="Ex: Conhecemos na conferência..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#1e3a5f] hover:bg-[#2a4f7f] text-white"
            >
              {isGenerating
                ? 'Gerando...'
                : generatedMessage
                  ? 'Regenerar'
                  : 'Gerar Mensagem'}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {generatedMessage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem Gerada
              </label>
              <MessageEditor
                content={generatedMessage}
                onChange={setGeneratedMessage}
                maxChars={selectedTemplateId ? 1000 : 300}
              />
              {metadata && (
                <p className="text-xs text-gray-400 mt-1">
                  Modelo: {metadata.model} | {metadata.tokensUsed} tokens |{' '}
                  {(metadata.generationTimeMs / 1000).toFixed(1)}s
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="font-medium text-gray-500">{label}</span>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}
