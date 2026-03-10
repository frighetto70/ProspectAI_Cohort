import { NextRequest, NextResponse } from 'next/server';
import {
  getProspectCount,
  deleteAllProspects,
  deleteProspectsByStatus,
} from '@/lib/services/prospect.service';

export async function GET() {
  const count = await getProspectCount();
  return NextResponse.json({ count });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  if (status) {
    const result = await deleteProspectsByStatus(status);
    return NextResponse.json(result);
  }

  const result = await deleteAllProspects();
  return NextResponse.json(result);
}
