import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/lib/db/schema';
import { prospects } from '@/lib/db/schema';
import { parseApifyItem } from '@/lib/services/scraper.service';
import { sql } from 'drizzle-orm';

// In-memory SQLite for tests
const client = createClient({ url: ':memory:' });
const testDb = drizzle(client, { schema });

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

describe('parseApifyItem', () => {
  it('should parse a complete Apify item', () => {
    const item = {
      fullName: 'Maria Santos',
      title: 'CTO',
      company: 'TechBrasil',
      industry: 'Technology',
      linkedInUrl: 'https://linkedin.com/in/mariasantos',
      headline: 'CTO at TechBrasil | Innovation Leader',
      summary: 'Experienced tech leader',
      location: 'São Paulo, Brazil',
      profileImageUrl: 'https://example.com/photo.jpg',
    };

    const result = parseApifyItem(item);

    expect(result.name).toBe('Maria Santos');
    expect(result.title).toBe('CTO');
    expect(result.company).toBe('TechBrasil');
    expect(result.industry).toBe('Technology');
    expect(result.linkedinUrl).toBe('https://linkedin.com/in/mariasantos');
    expect(result.headline).toBe('CTO at TechBrasil | Innovation Leader');
    expect(result.summary).toBe('Experienced tech leader');
    expect(result.location).toBe('São Paulo, Brazil');
    expect(result.profileImageUrl).toBe('https://example.com/photo.jpg');
    expect(result.status).toBe('new');
    expect(result.rawData).toBe(JSON.stringify(item));
  });

  it('should handle alternative field names', () => {
    const item = {
      name: 'Pedro Costa',
      jobTitle: 'VP Engineering',
      companyName: 'StartupXYZ',
      url: 'https://linkedin.com/in/pedrocosta',
      about: 'Building the future',
      geoLocation: 'Rio de Janeiro',
      avatar: 'https://example.com/avatar.jpg',
    };

    const result = parseApifyItem(item);

    expect(result.name).toBe('Pedro Costa');
    expect(result.title).toBe('VP Engineering');
    expect(result.company).toBe('StartupXYZ');
    expect(result.linkedinUrl).toBe('https://linkedin.com/in/pedrocosta');
    expect(result.summary).toBe('Building the future');
    expect(result.location).toBe('Rio de Janeiro');
    expect(result.profileImageUrl).toBe('https://example.com/avatar.jpg');
  });

  it('should handle profileUrl as fallback for linkedinUrl', () => {
    const item = {
      fullName: 'Ana Lima',
      profileUrl: 'https://linkedin.com/in/analima',
    };

    const result = parseApifyItem(item);
    expect(result.linkedinUrl).toBe('https://linkedin.com/in/analima');
  });

  it('should handle missing fields gracefully', () => {
    const item = {};

    const result = parseApifyItem(item);

    expect(result.name).toBe('Unknown');
    expect(result.title).toBeNull();
    expect(result.company).toBeNull();
    expect(result.industry).toBeNull();
    expect(result.linkedinUrl).toBeNull();
    expect(result.headline).toBeNull();
    expect(result.summary).toBeNull();
    expect(result.location).toBeNull();
    expect(result.profileImageUrl).toBeNull();
    expect(result.status).toBe('new');
  });
});

describe('Deduplication logic', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await client.execute('DELETE FROM prospects');
  });

  it('should insert new prospects', async () => {
    const parsed1 = parseApifyItem({
      fullName: 'João Silva',
      linkedInUrl: 'https://linkedin.com/in/joaosilva',
    });
    const parsed2 = parseApifyItem({
      fullName: 'Maria Santos',
      linkedInUrl: 'https://linkedin.com/in/mariasantos',
    });

    await testDb.insert(prospects).values(parsed1);
    await testDb.insert(prospects).values(parsed2);

    const all = await testDb.select().from(prospects);
    expect(all).toHaveLength(2);
  });

  it('should deduplicate by linkedin_url with onConflictDoNothing', async () => {
    // Pre-insert
    await testDb.insert(prospects).values({
      name: 'João Silva',
      linkedinUrl: 'https://linkedin.com/in/joaosilva',
      status: 'new',
    });

    // Try to insert duplicate
    const result = await testDb
      .insert(prospects)
      .values({
        name: 'João Silva Updated',
        linkedinUrl: 'https://linkedin.com/in/joaosilva',
        status: 'new',
      })
      .onConflictDoNothing({ target: prospects.linkedinUrl })
      .returning();

    // Should return empty (not inserted)
    expect(result).toHaveLength(0);

    // Original data preserved
    const [joao] = await testDb
      .select()
      .from(prospects)
      .where(sql`linkedin_url = 'https://linkedin.com/in/joaosilva'`);
    expect(joao.name).toBe('João Silva');
  });

  it('should count found vs new correctly', async () => {
    // Pre-insert one
    await testDb.insert(prospects).values({
      name: 'Existing',
      linkedinUrl: 'https://linkedin.com/in/existing',
      status: 'new',
    });

    const items = [
      { fullName: 'Existing Duplicate', linkedInUrl: 'https://linkedin.com/in/existing' },
      { fullName: 'New Person', linkedInUrl: 'https://linkedin.com/in/newperson' },
    ];

    let prospectsFound = 0;
    let prospectsNew = 0;

    for (const item of items) {
      prospectsFound++;
      const parsed = parseApifyItem(item);
      const insertResult = await testDb
        .insert(prospects)
        .values(parsed)
        .onConflictDoNothing({ target: prospects.linkedinUrl })
        .returning();
      if (insertResult.length > 0) prospectsNew++;
    }

    expect(prospectsFound).toBe(2);
    expect(prospectsNew).toBe(1);
  });

  it('should handle items with null linkedin_url', async () => {
    const parsed1 = parseApifyItem({ fullName: 'Sem LinkedIn 1' });
    const parsed2 = parseApifyItem({ fullName: 'Sem LinkedIn 2' });

    await testDb.insert(prospects).values(parsed1);
    await testDb.insert(prospects).values(parsed2);

    const all = await testDb.select().from(prospects);
    expect(all).toHaveLength(2);
  });
});

describe('Apify REST API error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw on 401 (invalid token)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      }),
    );

    const { runActor } = await import('@/lib/apify');
    await expect(runActor('test-actor', {})).rejects.toThrow('Apify runActor failed (401)');

    vi.unstubAllGlobals();
  });

  it('should throw on 404 (actor not found)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Actor not found'),
      }),
    );

    const { runActor } = await import('@/lib/apify');
    await expect(runActor('invalid-actor', {})).rejects.toThrow('Apify runActor failed (404)');

    vi.unstubAllGlobals();
  });

  it('should throw on getRunStatus failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error'),
      }),
    );

    const { getRunStatus } = await import('@/lib/apify');
    await expect(getRunStatus('run-123')).rejects.toThrow('Apify getRunStatus failed (500)');

    vi.unstubAllGlobals();
  });

  it('should throw on getDatasetItems failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Dataset error'),
      }),
    );

    const { getDatasetItems } = await import('@/lib/apify');
    await expect(getDatasetItems('dataset-abc')).rejects.toThrow(
      'Apify getDatasetItems failed (500)',
    );

    vi.unstubAllGlobals();
  });

  it('should return parsed JSON on success', async () => {
    const mockResponse = { data: { id: 'run-123', status: 'RUNNING' } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const { runActor } = await import('@/lib/apify');
    const result = await runActor('test-actor', { searchTerms: ['test'] });
    expect(result).toEqual(mockResponse);

    vi.unstubAllGlobals();
  });
});
