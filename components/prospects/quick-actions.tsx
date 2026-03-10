'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateProspectStatus, addProspectNote, discardProspect } from '@/actions/prospect-actions';

type QuickActionsProps = {
  prospectId: number;
  currentStatus: string;
};

const statusOptions = [
  { value: 'new', label: 'Novo' },
  { value: 'message_generated', label: 'Mensagem Gerada' },
  { value: 'sent', label: 'Enviado' },
  { value: 'replied', label: 'Respondido' },
  { value: 'converted', label: 'Convertido' },
  { value: 'discarded', label: 'Descartado' },
];

type ProspectStatus = 'new' | 'message_generated' | 'sent' | 'replied' | 'converted' | 'discarded';

export function QuickActions({ prospectId, currentStatus }: QuickActionsProps) {
  const router = useRouter();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(status: string | null) {
    if (!status) return;
    await updateProspectStatus(prospectId, status as ProspectStatus);
    router.refresh();
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    setSaving(true);
    await addProspectNote(prospectId, noteContent.trim());
    setNoteContent('');
    setShowNoteForm(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDiscard() {
    if (!confirm('Tem certeza que deseja descartar este prospect?')) return;
    await discardProspect(prospectId);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <a href="#message-generator">
          <Button variant="outline" size="sm">
            Gerar Mensagem
          </Button>
        </a>

        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Alterar Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNoteForm(!showNoteForm)}
        >
          {showNoteForm ? 'Cancelar Nota' : 'Adicionar Nota'}
        </Button>

        {currentStatus !== 'discarded' && (
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={handleDiscard}>
            Descartar
          </Button>
        )}
      </div>

      {showNoteForm && (
        <div className="flex gap-2">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Escreva sua nota..."
            rows={2}
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          />
          <Button
            onClick={handleAddNote}
            disabled={saving || !noteContent.trim()}
            size="sm"
            className="bg-[#1e3a5f] hover:bg-[#2a4f7f] text-white self-end"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      )}
    </div>
  );
}
