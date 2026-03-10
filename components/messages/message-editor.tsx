'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type MessageEditorProps = {
  content: string;
  onChange: (content: string) => void;
  maxChars?: number;
};

export function MessageEditor({ content, onChange, maxChars = 300 }: MessageEditorProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-y"
        placeholder="A mensagem gerada aparecerá aqui..."
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${content.length > maxChars ? 'text-red-500 font-medium' : 'text-gray-400'}`}
        >
          {content.length}/{maxChars} caracteres
        </span>
        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!content}>
          {copied ? '✓ Copiado!' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}
