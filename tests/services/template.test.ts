import { describe, it, expect } from 'vitest';
import { interpolateTemplate } from '@/lib/gemini';

describe('interpolateTemplate', () => {
  it('should replace all variables', () => {
    const template =
      'Olá {{prospect_name}}, vi que você é {{title}} na {{company}}.';
    const vars = {
      prospect_name: 'Ricardo',
      title: 'CEO',
      company: 'TechBrasil',
    };

    const result = interpolateTemplate(template, vars);
    expect(result).toBe('Olá Ricardo, vi que você é CEO na TechBrasil.');
  });

  it('should replace missing vars with N/A', () => {
    const template = 'Nome: {{prospect_name}}, Setor: {{industry}}';
    const vars = { prospect_name: 'Maria' };

    const result = interpolateTemplate(template, vars);
    expect(result).toBe('Nome: Maria, Setor: N/A');
  });

  it('should handle template with no variables', () => {
    const template = 'Gere uma mensagem profissional.';
    const result = interpolateTemplate(template, {});
    expect(result).toBe('Gere uma mensagem profissional.');
  });

  it('should handle all prospect variables', () => {
    const template = `- Nome: {{prospect_name}}
- Cargo: {{title}}
- Empresa: {{company}}
- Setor: {{industry}}
- Headline: {{headline}}
- Resumo: {{summary}}`;

    const vars = {
      prospect_name: 'João',
      title: 'CTO',
      company: 'Acme',
      industry: 'Fintech',
      headline: 'CTO at Acme',
      summary: 'Tech leader',
    };

    const result = interpolateTemplate(template, vars);
    expect(result).toContain('Nome: João');
    expect(result).toContain('Cargo: CTO');
    expect(result).toContain('Empresa: Acme');
    expect(result).toContain('Setor: Fintech');
    expect(result).toContain('Headline: CTO at Acme');
    expect(result).toContain('Resumo: Tech leader');
  });

  it('should handle duplicate variables', () => {
    const template = '{{prospect_name}} é {{prospect_name}}';
    const vars = { prospect_name: 'Ana' };

    const result = interpolateTemplate(template, vars);
    expect(result).toBe('Ana é Ana');
  });
});
