import { NextRequest, NextResponse } from 'next/server';
import { checkJobStatus } from '@/lib/services/scraper.service';

type RouteParams = { params: Promise<{ jobId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params;
    const job = await checkJobStatus(Number(jobId));

    if (!job) {
      return NextResponse.json(
        { error: { code: 'JOB_NOT_FOUND', message: 'Scrape job not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to check job status' } },
      { status: 500 },
    );
  }
}
