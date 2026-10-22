import { ThemeConfig, ThemePreset, ThemeShades } from './types';

// Converts #RRGGBB or #RGB to [r, g, b]
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return [13, 148, 136]; // Fallback to teal-600
  }
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Converts [r, g, b] to #rrggbb
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

// Converts RGB [0-255] to HSL [h: 0-360, s: 0-100, l: 0-100]
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Converts HSL [h: 0-360, s: 0-100, l: 0-100] to RGB [0-255]
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// Generate complete 11-step harmonious shade palette from any hex
export function generateShades(primaryHex: string): ThemeShades {
  const [r, g, b] = hexToRgb(primaryHex);
  const [h, s] = rgbToHsl(r, g, b);

  // Target lightness values for standard Tailwind-like shades
  const lightnessMap: Record<keyof ThemeShades, { l: number; sMultiplier: number }> = {
    50: { l: 97, sMultiplier: 0.75 },
    100: { l: 92, sMultiplier: 0.8 },
    200: { l: 84, sMultiplier: 0.85 },
    300: { l: 72, sMultiplier: 0.9 },
    400: { l: 58, sMultiplier: 0.95 },
    500: { l: 48, sMultiplier: 1.0 },
    600: { l: 40, sMultiplier: 1.0 },
    700: { l: 32, sMultiplier: 1.0 },
    800: { l: 24, sMultiplier: 1.0 },
    900: { l: 16, sMultiplier: 0.95 },
    950: { l: 9, sMultiplier: 0.9 },
  };

  const shades = {} as ThemeShades;
  for (const [shade, config] of Object.entries(lightnessMap)) {
    const key = parseInt(shade, 10) as keyof ThemeShades;
    if (key === 600) {
      shades[key] = primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`;
    } else {
      const sat = Math.min(100, Math.round(s * config.sMultiplier));
      const rgb = hslToRgb(h, sat, config.l);
      shades[key] = rgbToHex(rgb[0], rgb[1], rgb[2]);
    }
  }

  return shades;
}

// Lighten or darken hex
export function adjustLightness(hex: string, deltaPercent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const newL = Math.max(0, Math.min(100, l + deltaPercent));
  const [newR, newG, newB] = hslToRgb(h, s, newL);
  return rgbToHex(newR, newG, newB);
}

// Builds full ThemeConfig from partial preset or custom inputs
export function buildThemeConfig(
  input: Partial<ThemeConfig> & {
    primary: string;
    sidebarBg?: string;
    accent?: string;
  }
): ThemeConfig {
  const primary = input.primary.startsWith('#') ? input.primary : `#${input.primary}`;
  const shades = input.shades || generateShades(primary);
  const primaryHover = input.primaryHover || shades[700];

  const sidebarBg = input.sidebarBg || shades[900];
  const sidebarBorder =
    input.sidebarBorder || adjustLightness(sidebarBg, 8);
  const sidebarActive = input.sidebarActive || shades[600];
  const sidebarText = input.sidebarText || '#f8fafc';

  const accent = input.accent || '#10b981';
  const headerStyle = input.headerStyle || 'glass';
  const borderRadius = input.borderRadius || 'md';
  const dashboardBg = input.dashboardBg || '#f8fafc';

  return {
    id: input.id || 'custom',
    name: input.name || 'कस्टम थीम',
    nameEn: input.nameEn || 'Custom Theme',
    primary,
    primaryHover,
    sidebarBg,
    sidebarBorder,
    sidebarActive,
    sidebarText,
    accent,
    headerStyle,
    borderRadius,
    dashboardBg,
    shades,
    updatedAt: input.updatedAt || new Date().toISOString(),
    updatedBy: input.updatedBy || 'Admin',
  };
}

// Convert border radius token to CSS pixel/rem
export function getRadiusValue(option: ThemeConfig['borderRadius']): string {
  switch (option) {
    case 'sm':
      return '0.375rem';
    case 'lg':
      return '1rem';
    case 'xl':
      return '1.25rem';
    case 'md':
    default:
      return '0.75rem';
  }
}

// Generate CSS variable block for style injection
export function generateCssVariables(theme: ThemeConfig): string {
  return `
    --brand-teal-50: ${theme.shades[50]};
    --brand-teal-100: ${theme.shades[100]};
    --brand-teal-200: ${theme.shades[200]};
    --brand-teal-300: ${theme.shades[300]};
    --brand-teal-400: ${theme.shades[400]};
    --brand-teal-500: ${theme.shades[500]};
    --brand-teal-600: ${theme.shades[600]};
    --brand-teal-700: ${theme.shades[700]};
    --brand-teal-800: ${theme.shades[800]};
    --brand-teal-900: ${theme.shades[900]};
    --brand-teal-950: ${theme.shades[950]};

    --theme-primary: ${theme.primary};
    --theme-primary-hover: ${theme.primaryHover};
    --theme-primary-light: ${theme.shades[50]};
    --theme-primary-border: ${theme.shades[200]};
    --theme-primary-text: ${theme.shades[800]};

    --sidebar-bg: ${theme.sidebarBg};
    --sidebar-border: ${theme.sidebarBorder};
    --sidebar-active: ${theme.sidebarActive};
    --sidebar-text: ${theme.sidebarText};

    --theme-accent: ${theme.accent};
    --dashboard-bg: ${theme.dashboardBg};
    --theme-radius: ${getRadiusValue(theme.borderRadius)};
  `.trim();
}
