import { NextRequest, NextResponse } from 'next/server';
import { listProspects, createProspect } from '@/lib/services/prospect.service';
import { createProspectSchema } from '@/lib/validations/prospect';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const result = await listProspects({
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 20,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing prospects:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to list prospects' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProspectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }
    const prospect = await createProspect(parsed.data);
    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error('Error creating prospect:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create prospect' } },
      { status: 500 },
    );
  }
}
