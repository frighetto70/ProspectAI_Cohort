import { NextRequest, NextResponse } from 'next/server';
import { generateProspectMessage } from '@/lib/services/message.service';
import { z } from 'zod';

const bulkGenerateSchema = z.object({
  prospectIds: z.array(z.number()).min(1, 'At least one prospect required'),
  templateId: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bulkGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { prospectIds, templateId } = parsed.data;
    const results: { prospectId: number; success: boolean; error?: string }[] = [];

    for (const prospectId of prospectIds) {
      try {
        await generateProspectMessage({ prospectId, templateId });
        results.push({ prospectId, success: true });
      } catch (err) {
        results.push({
          prospectId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ total: prospectIds.length, succeeded, failed, results });
  } catch (error) {
    console.error('Error in bulk generate:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process bulk generation' } },
      { status: 500 },
    );
  }
}
