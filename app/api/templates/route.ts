import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messageTemplates } from '@/lib/db/schema';
import { createTemplateSchema } from '@/lib/validations/template';

export async function GET() {
  const templates = await db.select().from(messageTemplates).orderBy(messageTemplates.createdAt);
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const [template] = await db.insert(messageTemplates).values(parsed.data).returning();
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create template' } },
      { status: 500 },
    );
  }
}
