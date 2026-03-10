import { db } from './index';
import { messageTemplates } from './schema';

const defaultTemplates = [
  {
    name: 'Connection Request',
    type: 'connection_request' as const,
    systemPrompt: `Você é um consultor estratégico sênior especializado em transformação corporativa. Escreva mensagens de connection request no LinkedIn que sejam:
- Pessoais e específicas ao contexto do prospect
- Tom de colega estratégico, NUNCA de vendedor
- Curtas (máx 300 caracteres)
- Mencione algo específico do perfil do prospect
- Apresente o conceito 'Strategic Reset' de forma natural
- Sem emojis, sem exclamações excessivas, sem clichês de vendas`,
    userPromptTemplate: `Dados do prospect:
- Nome: {{prospect_name}}
- Cargo: {{title}}
- Empresa: {{company}}
- Setor: {{industry}}
- Headline: {{headline}}
- Resumo: {{summary}}

Gere uma mensagem de connection request curta e direta.`,
    isActive: true,
  },
  {
    name: 'Follow-up',
    type: 'follow_up' as const,
    systemPrompt: `Você é um consultor estratégico sênior. Escreva mensagens de follow-up após conexão aceita no LinkedIn:
- Tom mais detalhado que o connection request (até 500 chars)
- Reforce a relevância do Strategic Reset para o contexto do prospect
- Proponha uma conversa breve (15-20min)
- Mencione um insight específico sobre o setor ou empresa
- Mantenha tom de par estratégico`,
    userPromptTemplate: `Dados do prospect:
- Nome: {{prospect_name}}
- Cargo: {{title}}
- Empresa: {{company}}
- Setor: {{industry}}
- Headline: {{headline}}
- Resumo: {{summary}}

Gere uma mensagem de follow-up mencionando o Strategic Reset.`,
    isActive: true,
  },
  {
    name: 'InMail',
    type: 'inmail' as const,
    systemPrompt: `Você é um consultor estratégico sênior. Escreva InMails profissionais no LinkedIn:
- Tom mais formal e completo (até 1000 chars)
- Inclua proposta de valor clara do Strategic Reset
- Estrutura: gancho personalizado → problema identificado → proposta de valor → CTA
- Demonstre conhecimento do setor e desafios específicos
- Mantenha elegância e sofisticação na comunicação`,
    userPromptTemplate: `Dados do prospect:
- Nome: {{prospect_name}}
- Cargo: {{title}}
- Empresa: {{company}}
- Setor: {{industry}}
- Headline: {{headline}}
- Resumo: {{summary}}

Gere um InMail profissional com proposta de valor clara.`,
    isActive: true,
  },
];

async function seed() {
  console.log('Seeding default templates...');
  for (const template of defaultTemplates) {
    await db.insert(messageTemplates).values(template).onConflictDoNothing();
  }
  console.log('Seed complete: 3 templates created.');
}

seed().catch(console.error);
