import { NextRequest, NextResponse } from 'next/server';
import { exportProspectsCSV } from '@/lib/services/export.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const csv = await exportProspectsCSV({ status, search });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="prospects-export.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: { code: 'EXPORT_ERROR', message: 'Failed to export CSV' } },
      { status: 500 },
    );
  }
}
