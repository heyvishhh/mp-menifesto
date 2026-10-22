export type HeaderStyleOption = 'glass' | 'white' | 'tinted';
export type BorderRadiusOption = 'sm' | 'md' | 'lg' | 'xl';

export interface ThemeShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  nameEn: string;
  primary: string;
  primaryHover: string;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarActive: string;
  sidebarText: string;
  accent: string;
  headerStyle: HeaderStyleOption;
  borderRadius: BorderRadiusOption;
  dashboardBg: string;
  shades: ThemeShades;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  primary: string;
  sidebarBg: string;
  accent: string;
  headerStyle: HeaderStyleOption;
  borderRadius: BorderRadiusOption;
  dashboardBg: string;
}
