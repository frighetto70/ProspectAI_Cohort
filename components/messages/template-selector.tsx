'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Template = {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
};

type TemplateSelectorProps = {
  value: number | null;
  onChange: (templateId: number) => void;
};

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data: Template[]) => {
        const active = data.filter((t) => t.isActive);
        setTemplates(active);
        if (!value && active.length > 0) {
          onChange(active[0].id);
        }
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Select
      value={value ? String(value) : undefined}
      onValueChange={(v) => v && onChange(Number(v))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione um template" />
      </SelectTrigger>
      <SelectContent>
        {templates.map((t) => (
          <SelectItem key={t.id} value={String(t.id)}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
