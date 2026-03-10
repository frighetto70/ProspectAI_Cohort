'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'new', label: 'Novo' },
  { value: 'message_generated', label: 'Mensagem Gerada' },
  { value: 'sent', label: 'Enviado' },
  { value: 'replied', label: 'Respondido' },
  { value: 'converted', label: 'Convertido' },
  { value: 'discarded', label: 'Descartado' },
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // Reset page on filter change
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams('search', searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, updateParams]);

  return (
    <div className="flex gap-3 items-center">
      <Input
        placeholder="Buscar por nome, empresa..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="max-w-sm"
      />
      <Select
        value={searchParams.get('status') || 'all'}
        onValueChange={(value) => updateParams('status', value || 'all')}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
