import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['connection_request', 'follow_up', 'inmail']),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  userPromptTemplate: z.string().min(1, 'User prompt template is required'),
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();
