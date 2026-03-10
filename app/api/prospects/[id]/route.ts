import { NextRequest, NextResponse } from 'next/server';
import { getProspectById, updateProspect, deleteProspect } from '@/lib/services/prospect.service';
import { updateProspectSchema } from '@/lib/validations/prospect';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const prospect = await getProspectById(Number(id));
    if (!prospect) {
      return NextResponse.json(
        { error: { code: 'PROSPECT_NOT_FOUND', message: 'Prospect not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json(prospect);
  } catch (error) {
    console.error('Error getting prospect:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get prospect' } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProspectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }
    const prospect = await updateProspect(Number(id), parsed.data);
    if (!prospect) {
      return NextResponse.json(
        { error: { code: 'PROSPECT_NOT_FOUND', message: 'Prospect not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json(prospect);
  } catch (error) {
    console.error('Error updating prospect:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update prospect' } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteProspect(Number(id));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete prospect' } },
      { status: 500 },
    );
  }
}
