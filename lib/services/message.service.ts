import { db } from '@/lib/db';
import { prospects, messageTemplates, interactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateMessage, buildUserPrompt, interpolateTemplate } from '@/lib/gemini';

const DEFAULT_SYSTEM_PROMPT = `Você é um consultor estratégico sênior especializado em transformação corporativa. Escreva mensagens de prospecção no LinkedIn que sejam:
- Pessoais e específicas ao contexto do prospect
- Tom de colega estratégico, NUNCA de vendedor
- Curtas (máx 300 caracteres para connection request)
- Mencione algo específico do perfil do prospect
- Apresente o conceito 'Strategic Reset' de forma natural
- Sem emojis, sem exclamações excessivas, sem clichês de vendas`;

export type GenerateMessageParams = {
  prospectId: number;
  templateId?: number;
  customContext?: string;
};

export async function generateProspectMessage(params: GenerateMessageParams) {
  const { prospectId, templateId, customContext } = params;

  // Fetch prospect
  const prospect = await db.query.prospects.findFirst({
    where: eq(prospects.id, prospectId),
  });
  if (!prospect) {
    throw new Error('Prospect not found');
  }

  // Fetch template (or use defaults)
  let systemPrompt = DEFAULT_SYSTEM_PROMPT;
  let templateType = 'connection_request';
  let usedTemplateId = templateId;
  let userPromptTemplate: string | null = null;

  if (templateId) {
    const template = await db.query.messageTemplates.findFirst({
      where: eq(messageTemplates.id, templateId),
    });
    if (template) {
      systemPrompt = template.systemPrompt;
      templateType = template.type;
      userPromptTemplate = template.userPromptTemplate;
    }
  } else {
    // Find default template
    const defaultTemplate = await db.query.messageTemplates.findFirst({
      where: eq(messageTemplates.type, 'connection_request'),
    });
    if (defaultTemplate) {
      systemPrompt = defaultTemplate.systemPrompt;
      usedTemplateId = defaultTemplate.id;
      userPromptTemplate = defaultTemplate.userPromptTemplate;
    }
  }

  // Build user prompt: use template's userPromptTemplate with variable interpolation, or fallback
  const templateVars: Record<string, string> = {
    prospect_name: prospect.name,
    title: prospect.title || 'N/A',
    company: prospect.company || 'N/A',
    industry: prospect.industry || 'N/A',
    headline: prospect.headline || 'N/A',
    summary: prospect.summary || 'N/A',
  };

  let userPrompt: string;
  if (userPromptTemplate) {
    userPrompt = interpolateTemplate(userPromptTemplate, templateVars);
    if (customContext) {
      userPrompt += `\nContexto adicional: ${customContext}`;
    }
  } else {
    userPrompt = buildUserPrompt(prospect, templateType, customContext);
  }

  const result = await generateMessage({ systemPrompt, userPrompt });

  // Save to interactions
  const [interaction] = await db
    .insert(interactions)
    .values({
      prospectId,
      type: 'message_generated',
      content: result.content,
      templateId: usedTemplateId,
      metadata: JSON.stringify({
        model: result.model,
        tokensUsed: result.tokensUsed,
        generationTimeMs: result.generationTimeMs,
        templateUsed: templateType,
      }),
    })
    .returning();

  // Update prospect status
  await db
    .update(prospects)
    .set({ status: 'message_generated' })
    .where(eq(prospects.id, prospectId));

  return {
    id: interaction.id,
    prospectId,
    type: interaction.type,
    content: result.content,
    metadata: {
      model: result.model,
      tokensUsed: result.tokensUsed,
      generationTimeMs: result.generationTimeMs,
      templateUsed: templateType,
    },
    createdAt: interaction.createdAt,
  };
}
