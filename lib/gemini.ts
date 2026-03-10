import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Simple throttle: 1s minimum between calls
let lastCallTimestamp = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastCallTimestamp = Date.now();
}

export type GenerateMessageInput = {
  systemPrompt: string;
  userPrompt: string;
};

export type GenerateMessageResult = {
  content: string;
  model: string;
  tokensUsed: number;
  generationTimeMs: number;
};

export async function generateMessage(
  input: GenerateMessageInput,
): Promise<GenerateMessageResult> {
  await throttle();

  const startTime = Date.now();

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: input.systemPrompt,
  });

  const result = await model.generateContent(input.userPrompt);
  const response = result.response;
  const content = response.text();
  const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;
  const generationTimeMs = Date.now() - startTime;

  return {
    content,
    model: modelName,
    tokensUsed,
    generationTimeMs,
  };
}

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? 'N/A');
}

export function buildUserPrompt(prospect: {
  name: string;
  title: string | null;
  company: string | null;
  industry: string | null;
  headline: string | null;
  summary: string | null;
}, templateType: string, customContext?: string): string {
  return `Dados do prospect:
- Nome: ${prospect.name}
- Cargo: ${prospect.title || 'N/A'}
- Empresa: ${prospect.company || 'N/A'}
- Setor: ${prospect.industry || 'N/A'}
- Headline: ${prospect.headline || 'N/A'}
- Resumo: ${prospect.summary || 'N/A'}

Tipo de mensagem: ${templateType}
${customContext ? `Contexto adicional: ${customContext}` : ''}

Gere a mensagem de prospecção.`;
}
