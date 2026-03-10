import { NextRequest, NextResponse } from 'next/server';
import { generateProspectMessage } from '@/lib/services/message.service';
import { generateMessageSchema } from '@/lib/validations/message';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = generateMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const result = await generateProspectMessage({
      prospectId: Number(id),
      ...parsed.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating message:', error);

    const message = error instanceof Error ? error.message : 'Failed to generate message';

    if (message === 'Prospect not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: { code: 'GENERATION_ERROR', message } },
      { status: 500 },
    );
  }
}
