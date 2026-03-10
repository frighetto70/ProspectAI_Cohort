import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const prospects = sqliteTable('prospects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  title: text('title'),
  company: text('company'),
  industry: text('industry'),
  linkedinUrl: text('linkedin_url').unique(),
  headline: text('headline'),
  summary: text('summary'),
  location: text('location'),
  profileImageUrl: text('profile_image_url'),
  status: text('status', {
    enum: ['new', 'message_generated', 'sent', 'replied', 'converted', 'discarded'],
  })
    .default('new')
    .notNull(),
  rawData: text('raw_data'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const messageTemplates = sqliteTable('message_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['connection_request', 'follow_up', 'inmail'],
  }).notNull(),
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const interactions = sqliteTable('interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  prospectId: integer('prospect_id')
    .references(() => prospects.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type', {
    enum: ['message_generated', 'message_sent', 'reply', 'note'],
  }).notNull(),
  content: text('content').notNull(),
  templateId: integer('template_id').references(() => messageTemplates.id),
  metadata: text('metadata'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const scrapeJobs = sqliteTable('scrape_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  apifyRunId: text('apify_run_id'),
  criteria: text('criteria').notNull(),
  status: text('status', {
    enum: ['pending', 'running', 'completed', 'failed'],
  })
    .default('pending')
    .notNull(),
  prospectsFound: integer('prospects_found').default(0),
  prospectsNew: integer('prospects_new').default(0),
  error: text('error'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  completedAt: text('completed_at'),
});

// Type exports
export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type ScrapeJob = typeof scrapeJobs.$inferSelect;
