'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type Template = {
  id: number;
  name: string;
  type: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
  createdAt: string;
};

const typeLabels: Record<string, string> = {
  connection_request: 'Connection Request',
  follow_up: 'Follow-up',
  inmail: 'InMail',
};

const mockVars: Record<string, string> = {
  prospect_name: 'Ricardo Mendes',
  title: 'CEO',
  company: 'TechBrasil SA',
  industry: 'Technology',
  headline: 'CEO at TechBrasil | Digital Transformation Leader',
  summary: 'Executivo com 20+ anos liderando transformações corporativas...',
};

function interpolatePreview(template: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => mockVars[key] ?? `{{${key}}}`);
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', systemPrompt: '', userPromptTemplate: '' });
  const [showPreview, setShowPreview] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then(setTemplates)
      .catch(console.error);
  }, []);

  async function handleSave(id: number) {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditing(null);
    }
  }

  async function handleToggle(id: number, isActive: boolean) {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Templates de Mensagem</h1>

      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant="secondary">{typeLabels[template.type] || template.type}</Badge>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(showPreview === template.id ? null : template.id)}
                >
                  {showPreview === template.id ? 'Ocultar Preview' : 'Preview'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (editing === template.id) {
                      setEditing(null);
                    } else {
                      setEditing(template.id);
                      setEditForm({
                        name: template.name,
                        systemPrompt: template.systemPrompt,
                        userPromptTemplate: template.userPromptTemplate,
                      });
                    }
                  }}
                >
                  {editing === template.id ? 'Cancelar' : 'Editar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(template.id, template.isActive)}
                >
                  {template.isActive ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editing === template.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      System Prompt
                    </label>
                    <textarea
                      value={editForm.systemPrompt}
                      onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
                      rows={5}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Prompt Template
                    </label>
                    <textarea
                      value={editForm.userPromptTemplate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, userPromptTemplate: e.target.value })
                      }
                      rows={5}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {'Variáveis: {{prospect_name}}, {{title}}, {{company}}, {{industry}}, {{headline}}, {{summary}}'}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSave(template.id)}
                    className="bg-[#1e3a5f] hover:bg-[#2a4f7f] text-white"
                  >
                    Salvar
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-500 mb-1">System Prompt:</p>
                  <p className="whitespace-pre-wrap mb-3">{template.systemPrompt}</p>
                </div>
              )}

              {showPreview === template.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview (dados mock):
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {interpolatePreview(template.userPromptTemplate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Nenhum template encontrado. Execute o seed para criar os templates padrão.
          </p>
        )}
      </div>
    </div>
  );
}
