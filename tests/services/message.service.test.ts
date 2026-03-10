import { describe, it, expect } from 'vitest';
import { buildUserPrompt } from '@/lib/gemini';

describe('buildUserPrompt', () => {
  it('should build prompt with all prospect data', () => {
    const prospect = {
      name: 'Ricardo Mendes',
      title: 'CEO',
      company: 'Acme Corp',
      industry: 'Technology',
      headline: 'CEO at Acme Corp | Digital Transformation',
      summary: 'Experienced executive leading digital initiatives',
    };

    const result = buildUserPrompt(prospect, 'connection_request');

    expect(result).toContain('Nome: Ricardo Mendes');
    expect(result).toContain('Cargo: CEO');
    expect(result).toContain('Empresa: Acme Corp');
    expect(result).toContain('Setor: Technology');
    expect(result).toContain('Headline: CEO at Acme Corp');
    expect(result).toContain('Resumo: Experienced executive');
    expect(result).toContain('Tipo de mensagem: connection_request');
    expect(result).toContain('Gere a mensagem de prospecção.');
  });

  it('should handle null fields with N/A', () => {
    const prospect = {
      name: 'Maria Santos',
      title: null,
      company: null,
      industry: null,
      headline: null,
      summary: null,
    };

    const result = buildUserPrompt(prospect, 'inmail');

    expect(result).toContain('Nome: Maria Santos');
    expect(result).toContain('Cargo: N/A');
    expect(result).toContain('Empresa: N/A');
    expect(result).toContain('Setor: N/A');
    expect(result).toContain('Headline: N/A');
    expect(result).toContain('Resumo: N/A');
    expect(result).toContain('Tipo de mensagem: inmail');
  });

  it('should include custom context when provided', () => {
    const prospect = {
      name: 'João Silva',
      title: 'CTO',
      company: 'TechBrasil',
      industry: 'Technology',
      headline: null,
      summary: null,
    };

    const result = buildUserPrompt(
      prospect,
      'follow_up',
      'Conhecemos na conferência de São Paulo',
    );

    expect(result).toContain('Contexto adicional: Conhecemos na conferência de São Paulo');
  });

  it('should not include context line when not provided', () => {
    const prospect = {
      name: 'Ana Lima',
      title: 'VP',
      company: 'Corp',
      industry: null,
      headline: null,
      summary: null,
    };

    const result = buildUserPrompt(prospect, 'connection_request');

    expect(result).not.toContain('Contexto adicional');
  });

  it('should handle different template types', () => {
    const prospect = {
      name: 'Test',
      title: null,
      company: null,
      industry: null,
      headline: null,
      summary: null,
    };

    expect(buildUserPrompt(prospect, 'connection_request')).toContain(
      'Tipo de mensagem: connection_request',
    );
    expect(buildUserPrompt(prospect, 'follow_up')).toContain('Tipo de mensagem: follow_up');
    expect(buildUserPrompt(prospect, 'inmail')).toContain('Tipo de mensagem: inmail');
  });
});
