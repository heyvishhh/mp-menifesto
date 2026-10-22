import React from 'react';
import { generateCssVariables } from '@/lib/theme/colorUtils';
import { DEFAULT_THEME_CONFIG } from '@/lib/theme/presets';

const defaultCssVars = generateCssVariables(DEFAULT_THEME_CONFIG);

export function ThemeScript() {
  const inlineScript = `
    (function() {
      try {
        var stored = localStorage.getItem('mp_manifesto_global_theme');
        if (stored) {
          var t = JSON.parse(stored);
          if (t && t.shades) {
            var r = document.documentElement;
            var s = t.shades;
            for (var k in s) {
              r.style.setProperty('--brand-teal-' + k, s[k]);
            }
            if (t.sidebarBg) r.style.setProperty('--sidebar-bg', t.sidebarBg);
            if (t.sidebarBorder) r.style.setProperty('--sidebar-border', t.sidebarBorder);
            if (t.sidebarActive) r.style.setProperty('--sidebar-active', t.sidebarActive);
            if (t.sidebarText) r.style.setProperty('--sidebar-text', t.sidebarText);
            if (t.primary) r.style.setProperty('--theme-primary', t.primary);
            if (t.accent) r.style.setProperty('--theme-accent', t.accent);
            if (t.dashboardBg) r.style.setProperty('--dashboard-bg', t.dashboardBg);
          }
        }
      } catch (e) {}
    })();
  `;

  return (
    <>
      <style
        id="global-theme-default-vars"
        dangerouslySetInnerHTML={{
          __html: `:root { ${defaultCssVars} }`,
        }}
      />
      <script
        id="global-theme-hydration-script"
        dangerouslySetInnerHTML={{
          __html: inlineScript,
        }}
      />
    </>
  );
}
