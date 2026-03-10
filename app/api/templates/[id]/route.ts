import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messageTemplates } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { updateTemplateSchema } from '@/lib/validations/template';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(messageTemplates)
      .set({ ...parsed.data, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(messageTemplates.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update template' } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(messageTemplates)
      .where(eq(messageTemplates.id, Number(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete template' } },
      { status: 500 },
    );
  }
}
