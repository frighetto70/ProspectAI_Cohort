'use client';

import Link from 'next/link';
import type { Prospect } from '@/lib/db/schema';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function ProspectCard({ prospect }: { prospect: Prospect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
    data: { prospect },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <Link
        href={`/prospects/${prospect.id}`}
        className="text-sm font-semibold text-[#1e3a5f] hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {prospect.company || 'Empresa desconhecida'}
      </Link>
      <p className="text-xs text-gray-500 mt-0.5">
        {prospect.name}{prospect.title ? ` · ${prospect.title}` : ''}
      </p>
      <p className="text-[10px] text-gray-300 mt-1">
        {prospect.updatedAt
          ? new Date(prospect.updatedAt).toLocaleDateString('pt-BR')
          : ''}
      </p>
    </div>
  );
}
