import { NextRequest, NextResponse } from 'next/server';
import { startScrape } from '@/lib/services/scraper.service';
import { scrapeRequestSchema } from '@/lib/validations/scrape';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = scrapeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const result = await startScrape(parsed.data);
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    console.error('Error starting scrape:', error);

    const message = error instanceof Error ? error.message : 'Failed to start scrape';
    const status = message.includes('401') ? 401 : message.includes('404') ? 404 : 500;

    return NextResponse.json(
      { error: { code: 'SCRAPE_ERROR', message } },
      { status },
    );
  }
}
