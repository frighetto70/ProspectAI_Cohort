import { z } from 'zod';

export const prospectStatusEnum = z.enum([
  'new',
  'message_generated',
  'sent',
  'replied',
  'converted',
  'discarded',
]);

export const createProspectSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  status: prospectStatusEnum.optional(),
  rawData: z.string().optional(),
});

export const updateProspectSchema = createProspectSchema.partial();
