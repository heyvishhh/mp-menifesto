import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  generateShades,
  buildThemeConfig,
  generateCssVariables,
  adjustLightness,
} from '@/lib/theme/colorUtils';
import { THEME_PRESETS, DEFAULT_THEME_CONFIG } from '@/lib/theme/presets';

describe('Theme Color Utilities', () => {
  it('correctly converts between Hex and RGB', () => {
    expect(hexToRgb('#0d9488')).toEqual([13, 148, 136]);
    expect(rgbToHex(13, 148, 136)).toBe('#0d9488');

    // 3-char shorthand
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('correctly converts between RGB and HSL', () => {
    const [r, g, b] = [13, 148, 136];
    const [h, s, l] = rgbToHsl(r, g, b);
    expect(h).toBeGreaterThan(160);
    expect(h).toBeLessThan(190);
    expect(s).toBeGreaterThan(50);

    const [r2, g2, b2] = hslToRgb(h, s, l);
    expect(Math.abs(r - r2)).toBeLessThanOrEqual(4);
    expect(Math.abs(g - g2)).toBeLessThanOrEqual(4);
    expect(Math.abs(b - b2)).toBeLessThanOrEqual(4);
  });

  it('generates a full 11-shade palette for any primary color', () => {
    const shades = generateShades('#4f46e5');
    const expectedKeys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

    expectedKeys.forEach((key) => {
      expect(shades[key]).toMatch(/^#[0-9a-f]{6}$/i);
    });

    // 600 matches or relates closely to base input
    expect(shades[600].toLowerCase()).toBe('#4f46e5');
    // 50 should be a very light tint
    expect(hexToRgb(shades[50])[0]).toBeGreaterThan(200);
    // 950 should be very dark
    expect(hexToRgb(shades[950])[0]).toBeLessThan(60);
  });

  it('adjusts lightness properly', () => {
    const darkened = adjustLightness('#ffffff', -50);
    expect(hexToRgb(darkened)[0]).toBeLessThan(200);

    const lightened = adjustLightness('#000000', 50);
    expect(hexToRgb(lightened)[0]).toBeGreaterThan(50);
  });

  it('buildThemeConfig generates a complete theme structure with defaults', () => {
    const theme = buildThemeConfig({
      id: 'custom-emerald',
      name: 'Custom Emerald',
      primary: '#059669',
      sidebarBg: '#064e3b',
      accent: '#10b981',
    });

    expect(theme.primary).toBe('#059669');
    expect(theme.sidebarBg).toBe('#064e3b');
    expect(theme.accent).toBe('#10b981');
    expect(theme.shades[600]).toBe('#059669');
    expect(theme.headerStyle).toBe('glass');
    expect(theme.borderRadius).toBe('md');
    expect(theme.dashboardBg).toBe('#f8fafc');
  });

  it('validates all curated presets', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(8);

    THEME_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.nameEn).toBeTruthy();
      expect(preset.primary).toMatch(/^#[0-9a-f]{6}$/i);
      expect(preset.sidebarBg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(preset.accent).toMatch(/^#[0-9a-f]{6}$/i);

      const built = buildThemeConfig(preset);
      expect(built.shades[50]).toBeTruthy();
      expect(built.shades[950]).toBeTruthy();
    });
  });

  it('generates proper CSS variable declarations string', () => {
    const cssVars = generateCssVariables(DEFAULT_THEME_CONFIG);
    expect(cssVars).toContain('--brand-teal-50:');
    expect(cssVars).toContain('--brand-teal-600:');
    expect(cssVars).toContain('--sidebar-bg:');
    expect(cssVars).toContain('--theme-primary:');
    expect(cssVars).toContain('--theme-accent:');
  });
});
