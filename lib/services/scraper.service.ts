import { db } from '@/lib/db';
import { prospects, scrapeJobs, type NewProspect } from '@/lib/db/schema';
import { runActor, getRunStatus, getDatasetItems } from '@/lib/apify';
import { sql } from 'drizzle-orm';

const DEFAULT_ACTOR_ID = process.env.APIFY_ACTOR_ID || 'harvestapi/linkedin-profile-search';

export type ScrapeCriteria = {
  titles: string[];
  sectors: string[];
  companyProfile: string[];
  companies: string[];
  locations: string[];
  maxResults: number;
};

export function buildActorInput(criteria: ScrapeCriteria) {
  const takePages = Math.max(1, Math.ceil(criteria.maxResults / 25));

  // Use structured filters for precise targeting of current professionals
  // title: filters by current job title (not job seekers)
  const title = criteria.titles.join(', ');

  // keywordsCompany: matches company names/descriptions
  const keywordsCompany = [
    ...criteria.sectors,
    ...criteria.companies,
  ].filter(Boolean).join(', ');

  // search: general profile keywords (company profile traits)
  const search = criteria.companyProfile.length > 0
    ? criteria.companyProfile.join(' ')
    : undefined;

  // location: text-based location filter
  const location = criteria.locations.length > 0
    ? criteria.locations.join(', ')
    : undefined;

  return {
    title,
    ...(keywordsCompany && { keywordsCompany }),
    ...(search && { search }),
    ...(location && { location }),
    takePages,
  };
}

export async function startScrape(criteria: ScrapeCriteria) {
  // Create job record
  const [job] = await db
    .insert(scrapeJobs)
    .values({
      criteria: JSON.stringify(criteria),
      status: 'running',
    })
    .returning();

  try {
    const actorInput = buildActorInput(criteria);
    const takePages = Math.max(1, Math.ceil(criteria.maxResults / 25));
    const runResult = await runActor(DEFAULT_ACTOR_ID, {
      ...actorInput,
      takePages,
    });

    const apifyRunId = runResult.data?.id;

    await db
      .update(scrapeJobs)
      .set({ apifyRunId })
      .where(sql`id = ${job.id}`);

    return { jobId: job.id, apifyRunId, status: 'running' };
  } catch (error) {
    await db
      .update(scrapeJobs)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(sql`id = ${job.id}`);

    throw error;
  }
}

export async function checkJobStatus(jobId: number) {
  const [job] = await db
    .select()
    .from(scrapeJobs)
    .where(sql`id = ${jobId}`);

  if (!job) return null;
  if (!job.apifyRunId) return job;
  if (job.status === 'completed' || job.status === 'failed') return job;

  try {
    const runData = await getRunStatus(job.apifyRunId);
    const apifyStatus = runData.data?.status;

    if (apifyStatus === 'SUCCEEDED') {
      const datasetId = runData.data?.defaultDatasetId;
      const items = await getDatasetItems(datasetId);
      const { prospectsFound, prospectsNew } = await processScrapedData(items);

      const [updated] = await db
        .update(scrapeJobs)
        .set({
          status: 'completed',
          prospectsFound,
          prospectsNew,
          completedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(sql`id = ${jobId}`)
        .returning();

      return updated;
    }

    if (apifyStatus === 'FAILED' || apifyStatus === 'ABORTED' || apifyStatus === 'TIMED-OUT') {
      const [updated] = await db
        .update(scrapeJobs)
        .set({
          status: 'failed',
          error: `Apify run ${apifyStatus}`,
          completedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(sql`id = ${jobId}`)
        .returning();

      return updated;
    }

    // Still running
    return job;
  } catch (error) {
    const [updated] = await db
      .update(scrapeJobs)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed',
        completedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(sql`id = ${jobId}`)
      .returning();

    return updated;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseApifyItem(item: any): NewProspect {
  // Build full name from firstName/lastName (HarvestAPI format) or fallback to other formats
  const name = item.fullName
    || item.name
    || [item.firstName, item.lastName].filter(Boolean).join(' ')
    || 'Unknown';

  // Extract company from currentPosition (HarvestAPI) or direct fields
  const company = item.company
    || item.companyName
    || item.currentPosition?.companyName
    || null;

  // Extract title from position/currentPosition (HarvestAPI) or direct fields
  const title = item.title
    || item.jobTitle
    || item.position
    || item.currentPosition?.title
    || null;

  // Extract location - HarvestAPI nests it as { linkedinText, parsed: { city, country } }
  const location = item.location?.linkedinText
    || item.location?.parsed?.text
    || (typeof item.location === 'string' ? item.location : null)
    || item.geoLocation
    || null;

  return {
    name,
    title,
    company,
    industry: item.industry || null,
    linkedinUrl: item.linkedinUrl || item.linkedInUrl || item.url || item.profileUrl || null,
    headline: item.headline || null,
    summary: item.summary || item.about || null,
    location,
    profileImageUrl: item.profileImageUrl || item.avatar || item.photo || null,
    status: 'new',
    rawData: JSON.stringify(item),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processScrapedData(items: any[]) {
  let prospectsFound = 0;
  let prospectsNew = 0;

  for (const item of items) {
    prospectsFound++;
    const parsed = parseApifyItem(item);

    try {
      // INSERT OR IGNORE — dedup by linkedin_url
      const result = await db
        .insert(prospects)
        .values(parsed)
        .onConflictDoNothing({ target: prospects.linkedinUrl })
        .returning();

      if (result.length > 0) {
        prospectsNew++;
      }
    } catch {
      // Skip individual items that fail
      console.error('Failed to insert prospect:', parsed.name);
    }
  }

  return { prospectsFound, prospectsNew };
}
