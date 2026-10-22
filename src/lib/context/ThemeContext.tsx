'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { ThemeConfig } from '../theme/types';
import { DEFAULT_THEME_CONFIG, THEME_PRESETS } from '../theme/presets';
import { buildThemeConfig } from '../theme/colorUtils';

const LOCAL_STORAGE_KEY = 'mp_manifesto_global_theme';

interface ThemeContextType {
  theme: ThemeConfig;
  previewTheme: ThemeConfig;
  setPreviewTheme: (theme: ThemeConfig) => void;
  applyPreset: (presetId: string) => void;
  updatePrimaryColor: (color: string) => void;
  updateSidebarColor: (color: string) => void;
  updateAccentColor: (color: string) => void;
  updateHeaderStyle: (style: ThemeConfig['headerStyle']) => void;
  updateBorderRadius: (radius: ThemeConfig['borderRadius']) => void;
  updateDashboardBg: (bg: string) => void;
  saveGlobalTheme: () => Promise<boolean>;
  resetToDefault: () => Promise<boolean>;
  isCustomizerOpen: boolean;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  errorMessage: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeVariables(theme: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const { shades } = theme;

  root.style.setProperty('--brand-teal-50', shades[50]);
  root.style.setProperty('--brand-teal-100', shades[100]);
  root.style.setProperty('--brand-teal-200', shades[200]);
  root.style.setProperty('--brand-teal-300', shades[300]);
  root.style.setProperty('--brand-teal-400', shades[400]);
  root.style.setProperty('--brand-teal-500', shades[500]);
  root.style.setProperty('--brand-teal-600', shades[600]);
  root.style.setProperty('--brand-teal-700', shades[700]);
  root.style.setProperty('--brand-teal-800', shades[800]);
  root.style.setProperty('--brand-teal-900', shades[900]);
  root.style.setProperty('--brand-teal-950', shades[950]);

  root.style.setProperty('--sidebar-bg', theme.sidebarBg || shades[900]);
  root.style.setProperty('--sidebar-border', theme.sidebarBorder || shades[800]);
  root.style.setProperty('--sidebar-active', theme.sidebarActive || shades[600]);
  root.style.setProperty('--sidebar-text', theme.sidebarText || '#ffffff');
  root.style.setProperty('--theme-primary', theme.primary || shades[600]);
  root.style.setProperty('--theme-accent', theme.accent || '#10b981');
  root.style.setProperty('--dashboard-bg', theme.dashboardBg || '#f8fafc');
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeConfig;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme || DEFAULT_THEME_CONFIG);
  const [previewTheme, setPreviewThemeState] = useState<ThemeConfig>(
    initialTheme || DEFAULT_THEME_CONFIG
  );
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize theme from database API or localStorage
  useEffect(() => {
    let active = theme;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.shades) {
          active = parsed;
          setTheme(parsed);
          setPreviewThemeState(parsed);
          applyThemeVariables(parsed);
        }
      }
    } catch {
      // Fallback
    }

    // Always re-sync latest global theme from server to ensure multi-device & Vercel sync
    fetch('/api/theme')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.theme?.shades) {
          setTheme(data.theme);
          setPreviewThemeState(data.theme);
          applyThemeVariables(data.theme);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.theme));
          } catch {}
        }
      })
      .catch((err) => console.warn('[ThemeContext] Server theme fetch failed:', err));
  }, []);

  // Update preview theme and apply live DOM variables immediately
  const setPreviewTheme = useCallback((newTheme: ThemeConfig) => {
    setPreviewThemeState(newTheme);
    applyThemeVariables(newTheme);
  }, []);

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = THEME_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const fullTheme = buildThemeConfig(preset);
        setPreviewTheme(fullTheme);
      }
    },
    [setPreviewTheme]
  );

  const updatePrimaryColor = useCallback(
    (color: string) => {
      setPreviewTheme(
        buildThemeConfig({
          ...previewTheme,
          id: 'custom',
          name: 'कस्टम थीम',
          nameEn: 'Custom Theme',
          primary: color,
        })
      );
    },
    [previewTheme, setPreviewTheme]
  );

  const updateSidebarColor = useCallback(
    (color: string) => {
      setPreviewTheme(
        buildThemeConfig({
          ...previewTheme,
          id: 'custom',
          name: 'कस्टम थीम',
          nameEn: 'Custom Theme',
          sidebarBg: color,
        })
      );
    },
    [previewTheme, setPreviewTheme]
  );

  const updateAccentColor = useCallback(
    (color: string) => {
      setPreviewTheme(
        buildThemeConfig({
          ...previewTheme,
          id: 'custom',
          name: 'कस्टम थीम',
          nameEn: 'Custom Theme',
          accent: color,
        })
      );
    },
    [previewTheme, setPreviewTheme]
  );

  const updateHeaderStyle = useCallback(
    (headerStyle: ThemeConfig['headerStyle']) => {
      setPreviewTheme({
        ...previewTheme,
        headerStyle,
      });
    },
    [previewTheme, setPreviewTheme]
  );

  const updateBorderRadius = useCallback(
    (borderRadius: ThemeConfig['borderRadius']) => {
      setPreviewTheme({
        ...previewTheme,
        borderRadius,
      });
    },
    [previewTheme, setPreviewTheme]
  );

  const updateDashboardBg = useCallback(
    (dashboardBg: string) => {
      setPreviewTheme({
        ...previewTheme,
        dashboardBg,
      });
    },
    [previewTheme, setPreviewTheme]
  );

  const openCustomizer = useCallback(() => {
    setPreviewThemeState(theme);
    setSaveStatus('idle');
    setErrorMessage(null);
    setIsCustomizerOpen(true);
  }, [theme]);

  const closeCustomizer = useCallback(() => {
    // Revert preview back to saved theme if not saved
    applyThemeVariables(theme);
    setPreviewThemeState(theme);
    setIsCustomizerOpen(false);
  }, [theme]);

  const saveGlobalTheme = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: previewTheme,
          updatedBy: 'Admin / Dashboard User',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'थीम सहेजने में त्रुटि हुई।');
      }

      const savedTheme = data.theme || previewTheme;
      setTheme(savedTheme);
      setPreviewThemeState(savedTheme);
      applyThemeVariables(savedTheme);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedTheme));
      } catch {}

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 4000);
      return true;
    } catch (err) {
      setSaveStatus('error');
      setErrorMessage((err as Error).message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [previewTheme]);

  const resetToDefault = useCallback(async (): Promise<boolean> => {
    setPreviewTheme(DEFAULT_THEME_CONFIG);
    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: DEFAULT_THEME_CONFIG,
          updatedBy: 'Admin (Reset)',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'रीसेट करने में त्रुटि हुई।');
      }

      setTheme(DEFAULT_THEME_CONFIG);
      setPreviewThemeState(DEFAULT_THEME_CONFIG);
      applyThemeVariables(DEFAULT_THEME_CONFIG);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_THEME_CONFIG));
      } catch {}

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 4000);
      return true;
    } catch (err) {
      setSaveStatus('error');
      setErrorMessage((err as Error).message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [setPreviewTheme]);

  const contextValue = useMemo(
    () => ({
      theme,
      previewTheme,
      setPreviewTheme,
      applyPreset,
      updatePrimaryColor,
      updateSidebarColor,
      updateAccentColor,
      updateHeaderStyle,
      updateBorderRadius,
      updateDashboardBg,
      saveGlobalTheme,
      resetToDefault,
      isCustomizerOpen,
      openCustomizer,
      closeCustomizer,
      isSaving,
      saveStatus,
      errorMessage,
    }),
    [
      theme,
      previewTheme,
      setPreviewTheme,
      applyPreset,
      updatePrimaryColor,
      updateSidebarColor,
      updateAccentColor,
      updateHeaderStyle,
      updateBorderRadius,
      updateDashboardBg,
      saveGlobalTheme,
      resetToDefault,
      isCustomizerOpen,
      openCustomizer,
      closeCustomizer,
      isSaving,
      saveStatus,
      errorMessage,
    ]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
