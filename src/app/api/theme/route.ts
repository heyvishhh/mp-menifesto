import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getGlobalThemeFromDb, saveGlobalThemeToDb } from '@/lib/theme/db';
import { buildThemeConfig } from '@/lib/theme/colorUtils';
import { ThemeConfig } from '@/lib/theme/types';

export async function GET() {
  try {
    const theme = await getGlobalThemeFromDb();
    return NextResponse.json(
      { success: true, theme },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTheme = body.theme as Partial<ThemeConfig>;
    const updatedBy = body.updatedBy || 'Admin';

    if (!rawTheme || !rawTheme.primary) {
      return NextResponse.json(
        { success: false, error: 'प्राथमिक रंग (primary color) आवश्यक है।' },
        { status: 400 }
      );
    }

    const completeTheme = buildThemeConfig({
      ...rawTheme,
      primary: rawTheme.primary,
    });

    const savedTheme = await saveGlobalThemeToDb(completeTheme, updatedBy);

    // Revalidate dashboard layout on Vercel so all pages reflect the new theme
    try {
      revalidatePath('/', 'layout');
    } catch {
      // Revalidation warning non-fatal in local dev
    }

    return NextResponse.json({
      success: true,
      message: 'ग्लोबल थीम सफलतापूर्वक सहेजी गई। Vercel पर सभी विज़िटर्स के लिए लाइव है!',
      theme: savedTheme,
    });
  } catch (err) {
    console.error('[API /api/theme POST Error]:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
