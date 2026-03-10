'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { updateProspectStatus } from '@/actions/prospect-actions';
import type { Prospect } from '@/lib/db/schema';

type ProspectStatus = 'new' | 'message_generated' | 'sent' | 'replied' | 'converted' | 'discarded';

const columns: { id: ProspectStatus; title: string; color: string }[] = [
  { id: 'new', title: 'Novo', color: 'bg-gray-200 text-gray-700' },
  { id: 'message_generated', title: 'Msg Gerada', color: 'bg-purple-200 text-purple-800' },
  { id: 'sent', title: 'Enviado', color: 'bg-yellow-200 text-yellow-800' },
  { id: 'replied', title: 'Respondeu', color: 'bg-green-200 text-green-800' },
  { id: 'converted', title: 'Converteu', color: 'bg-[#1e3a5f] text-white' },
  { id: 'discarded', title: 'Descartado', color: 'bg-red-100 text-red-700' },
];

type KanbanBoardProps = {
  initialProspects: Prospect[];
};

export function KanbanBoard({ initialProspects }: KanbanBoardProps) {
  const [prospects, setProspects] = useState(initialProspects);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getProspectsByStatus = useCallback(
    (status: ProspectStatus) => prospects.filter((p) => p.status === status),
    [prospects],
  );

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as string;

    // Check if dropping over a column
    const targetColumn = columns.find((c) => c.id === overId);
    if (!targetColumn) return;

    setProspects((prev) =>
      prev.map((p) =>
        p.id === activeId ? { ...p, status: targetColumn.id } : p,
      ),
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as string;

    const targetColumn = columns.find((c) => c.id === overId);
    if (!targetColumn) return;

    // Call server action
    try {
      await updateProspectStatus(activeId, targetColumn.id);
    } catch {
      // Revert on error
      setProspects(initialProspects);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 md:flex-row flex-col">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            prospects={getProspectsByStatus(col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
