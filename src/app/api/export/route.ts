import { NextRequest, NextResponse } from 'next/server';
import { promiseRepository, departmentRepository } from '@/lib/repositories';
import { exportPromisesToExcel } from '@/lib/excel/exporter';
import { DashboardFilters, PromiseStatus, PoliticalImportance } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as PromiseStatus) || undefined;
    const politicalImportance = (searchParams.get('politicalImportance') as PoliticalImportance) || undefined;
    const searchQuery = searchParams.get('search') || undefined;

    const filters: Partial<DashboardFilters> = {};
    if (department && department !== 'ALL') filters.department = department;
    if (category && category !== 'ALL') filters.category = category;
    if (status && (status as string) !== 'ALL') filters.status = status;
    if (politicalImportance && (politicalImportance as string) !== 'ALL') filters.politicalImportance = politicalImportance;
    if (searchQuery) filters.searchQuery = searchQuery;

    const [promises, departments] = await Promise.all([
      promiseRepository.query(filters),
      departmentRepository.getAll(),
    ]);

    const filterDesc = Object.keys(filters).length > 0 
      ? `फ़िल्टर लागू: ${Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(', ')}`
      : 'समस्त रिकॉर्ड्स (अफ़िल्टर्ड)';

    const buffer = await exportPromisesToExcel(promises, {
      title: 'मध्य प्रदेश संकल्प पत्र 2023 - क्रियान्वयन एवं समीक्षा रिपोर्ट',
      filterDescription: filterDesc,
      departments,
    });

    const timestamp = new Date().toISOString().split('T')[0];
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="MP_Manifesto_Analysis_${timestamp}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    const msg = error instanceof Error ? error.message : 'एक्सेल निर्यात के दौरान त्रुटि उत्पन्न हुई।';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ids, filters } = body as { ids?: number[]; filters?: Partial<DashboardFilters> };

    let promises = await (filters ? promiseRepository.query(filters) : promiseRepository.getAll());
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const idSet = new Set(ids);
      promises = promises.filter(p => idSet.has(p.id));
    }

    const departments = await departmentRepository.getAll();
    const filterDesc = ids?.length 
      ? `चयनित ${ids.length} रिकॉर्ड्स का निर्यात`
      : 'डेटासेट निर्यात';

    const buffer = await exportPromisesToExcel(promises, {
      title: 'मध्य प्रदेश संकल्प पत्र 2023 - क्रियान्वयन एवं समीक्षा रिपोर्ट',
      filterDescription: filterDesc,
      departments,
    });

    const timestamp = new Date().toISOString().split('T')[0];
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="MP_Manifesto_Selected_${timestamp}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    const msg = error instanceof Error ? error.message : 'निर्यात असफल रहा।';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
