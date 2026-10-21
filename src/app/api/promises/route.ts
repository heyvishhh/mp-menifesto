import { NextRequest, NextResponse } from 'next/server';
import { promiseRepository } from '@/lib/repositories';
import { DashboardFilters, PromiseStatus, PoliticalImportance } from '@/types';
import { promiseCreateSchema, promiseUpdateSchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as PromiseStatus) || undefined;
    const politicalImportance = (searchParams.get('politicalImportance') as PoliticalImportance) || undefined;
    const searchQuery = searchParams.get('search') || undefined;
    const format = searchParams.get('format');

    const filters: Partial<DashboardFilters> = {};
    if (department && department !== 'ALL') filters.department = department;
    if (category && category !== 'ALL') filters.category = category;
    if (status && (status as string) !== 'ALL') filters.status = status;
    if (politicalImportance && (politicalImportance as string) !== 'ALL') filters.politicalImportance = politicalImportance;
    if (searchQuery) filters.searchQuery = searchQuery;

    const promises = await promiseRepository.query(filters);

    if (format === 'json') {
      const response = new NextResponse(JSON.stringify(promises, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="mp_manifesto_promises.json"',
        },
      });
      return response;
    }

    return NextResponse.json({
      success: true,
      count: promises.length,
      data: promises,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = promiseCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'मान्यता त्रुटि (Validation Failed)', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { modifiedBy, ...promiseData } = body;
    const created = await promiseRepository.create(promiseData, modifiedBy || 'प्रशासनिक अधिकारी');

    return NextResponse.json({
      success: true,
      data: created,
    }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'प्रविष्टि जोड़ने में त्रुटि';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates, modifiedBy, expectedVersion } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid promise id is required' },
        { status: 400 }
      );
    }

    const validation = promiseUpdateSchema.safeParse(updates);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'अमान्य फ़ील्ड मान', details: validation.error.format() },
        { status: 400 }
      );
    }

    const updated = await promiseRepository.update(id, updates, modifiedBy, expectedVersion);
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    const status = msg.includes('Conflict:') ? 409 : 500;
    return NextResponse.json(
      { success: false, error: msg },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const modifiedBy = searchParams.get('modifiedBy') || 'प्रशासनिक अधिकारी';

    if (!idParam) {
      return NextResponse.json({ success: false, error: 'Promise ID is required' }, { status: 400 });
    }

    const id = Number(idParam);
    const deleted = await promiseRepository.delete(id, modifiedBy);

    if (!deleted) {
      return NextResponse.json({ success: false, error: `Promise #${id} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Promise #${id} successfully deleted` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
