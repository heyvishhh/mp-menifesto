import { NextRequest, NextResponse } from 'next/server';
import { analyticsRepository } from '@/lib/repositories';
import { DashboardFilters, PromiseStatus, PoliticalImportance } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as PromiseStatus) || undefined;
    const politicalImportance = (searchParams.get('politicalImportance') as PoliticalImportance) || undefined;

    const filters: Partial<DashboardFilters> = {};
    if (department && department !== 'ALL') filters.department = department;
    if (category && category !== 'ALL') filters.category = category;
    if (status && (status as string) !== 'ALL') filters.status = status;
    if (politicalImportance && (politicalImportance as string) !== 'ALL') filters.politicalImportance = politicalImportance;

    const [overview, departments, categories] = await Promise.all([
      analyticsRepository.getOverviewMetrics(filters),
      analyticsRepository.getDepartmentBreakdown(filters),
      analyticsRepository.getCategoryBreakdown(filters),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview,
        departments,
        categories,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Analytics calculation failed';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
