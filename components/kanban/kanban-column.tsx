'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProspectCard } from './prospect-card';
import type { Prospect } from '@/lib/db/schema';

type KanbanColumnProps = {
  id: string;
  title: string;
  color: string;
  prospects: Prospect[];
};

export function KanbanColumn({ id, title, color, prospects }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex-shrink-0 w-64 md:w-auto md:flex-1 min-w-[220px] rounded-lg ${isOver ? 'ring-2 ring-[#1e3a5f]' : ''}`}
    >
      <div className={`px-3 py-2 rounded-t-lg ${color}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs bg-white/30 rounded-full px-2 py-0.5">
            {prospects.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px]"
      >
        <SortableContext
          items={prospects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {prospects.map((prospect) => (
            <ProspectCard key={prospect.id} prospect={prospect} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
