import { z } from 'zod';

export const generateMessageSchema = z.object({
  templateId: z.number().optional(),
  customContext: z.string().max(500).optional(),
});
