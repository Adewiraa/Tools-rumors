// Algorithmic HSL Color Generator & Harmony Engine for Realtime Color Studio

export interface ThemePalette {
  name?: string;
  primary: string;       // e.g. #3b82f6 or hex
  primaryHover: string;
  accent: string;
  background: string;
  surface: string;
  sidebar: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  isDark: boolean;
}

export type RandomMode = 'all' | 'dark' | 'light' | 'vibrant';
export type ColorSchemeType = 'all' | 'monochromatic' | 'analogous' | 'complementary' | 'split-complementary' | 'triadic' | 'tetradic';

export const DEFAULT_THEME_PALETTE: ThemePalette = {
  name: 'Quiet Stadium Sage',
  primary: '#66756A',
  primaryHover: '#536057',
  accent: '#A98C64',
  background: '#F6F5F1',
  surface: '#FCFBF8',
  sidebar: '#151A1D',
  textPrimary: '#232729',
  textSecondary: '#4D5558',
  border: '#E3E1DA',
  isDark: false,
};

export const UNIVERSAL_PORTAL_THEME: ThemePalette = {
  name: 'Universal Dark Portal',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  accent: '#f59e0b',
  background: '#0b0f17',
  surface: '#151c28',
  sidebar: '#0b0f17',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#1e293b',
  isDark: true,
};

// HSL Helper Functions
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Calculate relative luminance according to W3C
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate W3C contrast ratio
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

// Rating Kepatuhan Aksesibilitas WCAG 2.1
export function getWCAGRating(ratio: number): { text: string; pass: boolean; level: 'AAA' | 'AA' | 'Fail' } {
  if (ratio >= 7) return { text: 'AAA (Sangat Baik)', pass: true, level: 'AAA' };
  if (ratio >= 4.5) return { text: 'AA (Standar Bagus)', pass: true, level: 'AA' };
  if (ratio >= 3) return { text: 'AA Large (Teks Besar)', pass: true, level: 'AA' };
  return { text: 'Fail (Kontras Rendah)', pass: false, level: 'Fail' };
}

// Generate 10-Step Shade & Tint Scale (50 - 950)
export function generateShades(baseHex: string): { step: number; hex: string }[] {
  const { r, g, b } = hexToRgb(baseHex);
  // Convert RGB to HSL
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  const hue = Math.round(h * 360);
  const sat = Math.round(s * 100);

  const steps = [
    { step: 50, lightness: 95 },
    { step: 100, lightness: 90 },
    { step: 200, lightness: 80 },
    { step: 300, lightness: 70 },
    { step: 400, lightness: 60 },
    { step: 500, lightness: 50 },
    { step: 600, lightness: 40 },
    { step: 700, lightness: 30 },
    { step: 800, lightness: 20 },
    { step: 900, lightness: 12 },
    { step: 950, lightness: 6 },
  ];

  return steps.map(st => ({
    step: st.step,
    hex: hslToHex(hue, sat, st.lightness),
  }));
}

// Preset Themes Collection (Terkurasi Media Sepakbola Modern & Kalem)
export const PRESET_THEMES: ThemePalette[] = [
  DEFAULT_THEME_PALETTE,
  {
    name: 'Pitch Emerald (Kalem)',
    primary: '#10b981',
    primaryHover: '#059669',
    accent: '#059669',
    background: '#f0fdf4',
    surface: '#ffffff',
    sidebar: '#064e3b',
    textPrimary: '#064e3b',
    textSecondary: '#047857',
    border: '#a7f3d0',
    isDark: false,
  },
  {
    name: 'Stadium Dark Navy',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    accent: '#10b981',
    background: '#0f172a',
    surface: '#1e293b',
    sidebar: '#090d16',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    isDark: true,
  },
  {
    name: 'Editorial Slate',
    primary: '#475569',
    primaryHover: '#334155',
    accent: '#2563eb',
    background: '#f8fafc',
    surface: '#ffffff',
    sidebar: '#0f172a',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    isDark: false,
  },
  {
    name: 'Modern Teal Sports',
    primary: '#0d9488',
    primaryHover: '#0f766e',
    accent: '#f59e0b',
    background: '#f0fdfa',
    surface: '#ffffff',
    sidebar: '#115e59',
    textPrimary: '#134e4a',
    textSecondary: '#0f766e',
    border: '#99f6e4',
    isDark: false,
  },
  {
    name: 'Tactical Charcoal',
    primary: '#64748b',
    primaryHover: '#475569',
    accent: '#06b6d4',
    background: '#18181b',
    surface: '#27272a',
    sidebar: '#09090b',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    border: '#3f3f46',
    isDark: true,
  },
  {
    name: 'Classic Match Gray',
    primary: '#52525b',
    primaryHover: '#3f3f46',
    accent: '#d97706',
    background: '#fafafa',
    surface: '#ffffff',
    sidebar: '#18181b',
    textPrimary: '#18181b',
    textSecondary: '#71717a',
    border: '#e4e4e7',
    isDark: false,
  },
  UNIVERSAL_PORTAL_THEME,
];

// Apply Theme Palette to document root CSS variables dynamically
export function applyThemeToDocument(palette: ThemePalette) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Primary color mappings
  root.style.setProperty('--primary-600', palette.primary);
  root.style.setProperty('--primary-500', palette.primary);
  root.style.setProperty('--primary-700', palette.primaryHover);
  
  // Accent and Toast success/warning mapping
  root.style.setProperty('--accent-500', palette.accent);
  root.style.setProperty('--accent-600', palette.accent);
  root.style.setProperty('--success-600', palette.primary);
  root.style.setProperty('--warning-600', palette.accent);
  root.style.setProperty('--warning-500', palette.accent);

  // Background and surface
  root.style.setProperty('--neutral-50', palette.background);
  root.style.setProperty('--white', palette.surface);
  
  // Sidebar navy tones
  root.style.setProperty('--navy-950', palette.sidebar);
  root.style.setProperty('--navy-900', palette.sidebar);
  root.style.setProperty('--navy-800', palette.sidebar);

  // Text color mapping
  root.style.setProperty('--neutral-950', palette.textPrimary);
  root.style.setProperty('--neutral-700', palette.textSecondary);
  root.style.setProperty('--neutral-500', palette.textSecondary);

  // Border color mapping
  root.style.setProperty('--neutral-200', palette.border);
  root.style.setProperty('--neutral-100', palette.border);

  // Toggle body dark/light background
  document.body.style.backgroundColor = palette.background;
  document.body.style.color = palette.textPrimary;
}

export function exportCSSVariables(palette: ThemePalette): string {
  return `:root {
  --primary-600: ${palette.primary};
  --primary-500: ${palette.primary};
  --primary-700: ${palette.primaryHover};
  --accent-500: ${palette.accent};
  --neutral-50: ${palette.background};
  --white: ${palette.surface};
  --navy-950: ${palette.sidebar};
  --neutral-950: ${palette.textPrimary};
  --neutral-700: ${palette.textSecondary};
  --neutral-200: ${palette.border};
}`;
}
