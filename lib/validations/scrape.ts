import { z } from 'zod';

export const scrapeRequestSchema = z.object({
  titles: z.array(z.string()).min(1, 'At least one title required'),
  sectors: z.array(z.string()).min(1, 'At least one sector required'),
  companyProfile: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  locations: z.array(z.string()).default(['Brazil']),
  maxResults: z.number().min(1).max(1000).default(50),
});
