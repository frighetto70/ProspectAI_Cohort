import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/lib/db/schema';
import { prospects } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// In-memory SQLite for tests
const client = createClient({ url: ':memory:' });
const testDb = drizzle(client, { schema });

// We need to manually create tables since we can't use the service's db directly
async function setupTestDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS prospects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      company TEXT,
      industry TEXT,
      linkedin_url TEXT UNIQUE,
      headline TEXT,
      summary TEXT,
      location TEXT,
      profile_image_url TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      raw_data TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      user_prompt_template TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospect_id INTEGER NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      template_id INTEGER REFERENCES message_templates(id),
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS scrape_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apify_run_id TEXT,
      criteria TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      prospects_found INTEGER DEFAULT 0,
      prospects_new INTEGER DEFAULT 0,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )
  `);
}

describe('Prospect Service - Schema Validation', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await client.execute('DELETE FROM interactions');
    await client.execute('DELETE FROM prospects');
  });

  it('should create a prospect', async () => {
    const result = await testDb
      .insert(prospects)
      .values({
        name: 'João Silva',
        title: 'CEO',
        company: 'Acme Corp',
        industry: 'Technology',
        linkedinUrl: 'https://linkedin.com/in/joaosilva',
        headline: 'CEO at Acme Corp',
        status: 'new',
      })
      .returning();

    expect(result[0]).toBeDefined();
    expect(result[0].name).toBe('João Silva');
    expect(result[0].status).toBe('new');
    expect(result[0].id).toBeGreaterThan(0);
  });

  it('should enforce unique linkedin_url', async () => {
    await testDb.insert(prospects).values({
      name: 'João Silva',
      linkedinUrl: 'https://linkedin.com/in/joaosilva',
    });

    await expect(
      testDb.insert(prospects).values({
        name: 'Maria Santos',
        linkedinUrl: 'https://linkedin.com/in/joaosilva',
      }),
    ).rejects.toThrow();
  });

  it('should list prospects with filters', async () => {
    await testDb.insert(prospects).values([
      { name: 'João Silva', company: 'Acme', status: 'new' },
      { name: 'Maria Santos', company: 'TechCo', status: 'sent' },
      { name: 'Pedro Costa', company: 'Acme', status: 'new' },
    ]);

    // Filter by status
    const newProspects = await testDb
      .select()
      .from(prospects)
      .where(sql`status = 'new'`);
    expect(newProspects).toHaveLength(2);

    // Filter by company (LIKE)
    const acmeProspects = await testDb
      .select()
      .from(prospects)
      .where(sql`company LIKE '%Acme%'`);
    expect(acmeProspects).toHaveLength(2);
  });

  it('should update a prospect', async () => {
    const [created] = await testDb
      .insert(prospects)
      .values({ name: 'João Silva', status: 'new' })
      .returning();

    const [updated] = await testDb
      .update(prospects)
      .set({ status: 'sent', company: 'NewCorp' })
      .where(sql`id = ${created.id}`)
      .returning();

    expect(updated.status).toBe('sent');
    expect(updated.company).toBe('NewCorp');
  });

  it('should delete a prospect and cascade interactions', async () => {
    const [prospect] = await testDb
      .insert(prospects)
      .values({ name: 'João Silva' })
      .returning();

    await testDb.insert(schema.interactions).values({
      prospectId: prospect.id,
      type: 'note',
      content: 'Test note',
    });

    await testDb.delete(prospects).where(sql`id = ${prospect.id}`);

    const remaining = await testDb.select().from(prospects);
    expect(remaining).toHaveLength(0);

    const remainingInteractions = await testDb.select().from(schema.interactions);
    expect(remainingInteractions).toHaveLength(0);
  });
});
