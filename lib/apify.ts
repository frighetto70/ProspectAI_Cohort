const APIFY_BASE = 'https://api.apify.com/v2';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.APIFY_TOKEN}`,
  };
}

export async function runActor(actorId: string, input: Record<string, unknown>) {
  // Apify API uses ~ instead of / for actor IDs (e.g., anchor~linkedin-people-search-scraper)
  const normalizedId = actorId.replace('/', '~');
  const res = await fetch(`${APIFY_BASE}/acts/${normalizedId}/runs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Apify runActor failed (${res.status}): ${error}`);
  }

  return res.json();
}

export async function getRunStatus(runId: string) {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Apify getRunStatus failed (${res.status}): ${error}`);
  }

  return res.json();
}

export async function getDatasetItems(datasetId: string) {
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Apify getDatasetItems failed (${res.status}): ${error}`);
  }

  return res.json();
}
