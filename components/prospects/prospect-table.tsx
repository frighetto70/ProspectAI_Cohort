'use client';

import Link from 'next/link';
import type { Prospect } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

type ProspectTableProps = {
  prospects: Prospect[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
};

export function ProspectTable({ prospects, selectedIds, onSelectionChange }: ProspectTableProps) {
  if (prospects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Nenhum prospect encontrado</p>
        <p className="text-sm mt-1">Use a página de Configurações para buscar novos prospects.</p>
      </div>
    );
  }

  const allSelected = prospects.every((p) => selectedIds.includes(p.id));

  function toggleAll() {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(prospects.map((p) => p.id));
    }
  }

  function toggleOne(id: number) {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="rounded border-gray-300"
            />
          </TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prospects.map((prospect) => (
          <TableRow key={prospect.id}>
            <TableCell>
              <input
                type="checkbox"
                checked={selectedIds.includes(prospect.id)}
                onChange={() => toggleOne(prospect.id)}
                className="rounded border-gray-300"
              />
            </TableCell>
            <TableCell>
              <Link
                href={`/prospects/${prospect.id}`}
                className="text-[#1e3a5f] font-semibold hover:underline"
              >
                {prospect.company || 'Empresa desconhecida'}
              </Link>
              {prospect.industry && (
                <span className="text-xs text-gray-400 ml-1">· {prospect.industry}</span>
              )}
            </TableCell>
            <TableCell className="text-gray-600">{prospect.name}</TableCell>
            <TableCell className="text-gray-600">{prospect.title || '—'}</TableCell>
            <TableCell>
              <Badge variant="secondary" className={statusColors[prospect.status] || ''}>
                {statusLabels[prospect.status] || prospect.status}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-500 text-sm">
              {prospect.createdAt
                ? new Date(prospect.createdAt).toLocaleDateString('pt-BR')
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
