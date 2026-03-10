'use client';

import { useState } from 'react';
import type { Prospect } from '@/lib/db/schema';
import { ProspectTable } from './prospect-table';
import { Button } from '@/components/ui/button';

type ProspectListProps = {
  prospects: Prospect[];
};

export function ProspectList({ prospects }: ProspectListProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    succeeded: number;
    failed: number;
  } | null>(null);

  async function handleBulkGenerate() {
    setBulkLoading(true);
    setBulkResult(null);

    try {
      const res = await fetch('/api/prospects/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectIds: selectedIds }),
      });

      if (res.ok) {
        const data = await res.json();
        setBulkResult({ succeeded: data.succeeded, failed: data.failed });
        setSelectedIds([]);
      }
    } catch {
      console.error('Bulk generation failed');
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-[#1e3a5f]">
            {selectedIds.length} prospect{selectedIds.length !== 1 ? 's' : ''} selecionado{selectedIds.length !== 1 ? 's' : ''}
          </span>
          <Button
            onClick={handleBulkGenerate}
            disabled={bulkLoading}
            size="sm"
            className="bg-[#1e3a5f] hover:bg-[#2a4f7f] text-white"
          >
            {bulkLoading
              ? `Gerando mensagens...`
              : `Gerar Mensagens (${selectedIds.length})`}
          </Button>
        </div>
      )}

      {bulkResult && (
        <div className="mb-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          Geração em lote concluída: {bulkResult.succeeded} sucesso
          {bulkResult.failed > 0 && `, ${bulkResult.failed} falha(s)`}
        </div>
      )}

      <ProspectTable
        prospects={prospects}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}
