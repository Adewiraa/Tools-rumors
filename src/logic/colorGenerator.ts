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
  name: 'Default Navy',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  accent: '#eab308',
  background: '#f8fafc',
  surface: '#ffffff',
  sidebar: '#0f172a',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  isDark: false,
};

export const UNIVERSAL_PORTAL_THEME: ThemePalette = {
  name: 'Universal Portal',
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

// Ensure high contrast text color (either dark or light)
export function getHighContrastTextColor(bgHex: string): string {
  const lum = getLuminance(bgHex);
  return lum > 0.4 ? '#0f172a' : '#f8fafc';
}

// Generate subtle border color based on background
function getBorderColor(bgHex: string, isDark: boolean): string {
  if (isDark) {
    return '#1e293b';
  }
  return '#e2e8f0';
}

// Infinite Algorithmic Palette Generator with Color Schemes & Lock Pin Support
export function generateRandomPalette(
  mode: RandomMode = 'all',
  scheme: ColorSchemeType = 'all',
  locked: Record<string, boolean> = {},
  current?: ThemePalette
): ThemePalette {
  const forceDark = mode === 'dark' ? true : mode === 'light' ? false : Math.random() > 0.45;
  
  // Random base hue (0 - 360)
  const baseHue = Math.floor(Math.random() * 360);
  
  // Determine Accent Hue based on Color Harmony Scheme
  let selectedScheme = scheme;
  if (selectedScheme === 'all') {
    const schemes: ColorSchemeType[] = ['monochromatic', 'analogous', 'complementary', 'split-complementary', 'triadic', 'tetradic'];
    selectedScheme = schemes[Math.floor(Math.random() * schemes.length)];
  }

  let accentHue = baseHue;
  let accentSatShift = 0;
  let accentLightShift = 0;

  switch (selectedScheme) {
    case 'monochromatic':
      accentHue = baseHue;
      accentSatShift = -20;
      accentLightShift = 25;
      break;
    case 'analogous':
      accentHue = (baseHue + (Math.random() > 0.5 ? 30 : 330)) % 360;
      break;
    case 'complementary':
      accentHue = (baseHue + 180) % 360;
      break;
    case 'split-complementary':
      accentHue = (baseHue + (Math.random() > 0.5 ? 150 : 210)) % 360;
      break;
    case 'triadic':
      accentHue = (baseHue + (Math.random() > 0.5 ? 120 : 240)) % 360;
      break;
    case 'tetradic':
      accentHue = (baseHue + (Math.random() > 0.5 ? 90 : 270)) % 360;
      break;
  }

  const primarySat = mode === 'vibrant' ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 30);
  const primaryLight = forceDark ? 50 + Math.floor(Math.random() * 18) : 42 + Math.floor(Math.random() * 18);
  const primaryHex = hslToHex(baseHue, primarySat, primaryLight);
  const primaryHoverHex = hslToHex(baseHue, primarySat, Math.max(20, primaryLight - 8));

  const accentSat = Math.min(100, Math.max(30, 75 + Math.floor(Math.random() * 25) + accentSatShift));
  const accentLight = Math.min(85, Math.max(25, 50 + Math.floor(Math.random() * 15) + accentLightShift));
  const accentHex = hslToHex(accentHue, accentSat, accentLight);

  let bgHex = '#f8fafc';
  let surfaceHex = '#ffffff';
  let sidebarHex = '#0f172a';
  let textPrimaryHex = '#0f172a';
  let textSecondaryHex = '#64748b';

  if (forceDark) {
    // Dark background variations
    const bgHue = (baseHue + 10) % 360;
    const bgSat = 15 + Math.floor(Math.random() * 20);
    const bgLight = 5 + Math.floor(Math.random() * 6); // 5% - 11%
    bgHex = hslToHex(bgHue, bgSat, bgLight);
    
    // Surface is slightly lighter than background
    surfaceHex = hslToHex(bgHue, bgSat + 5, bgLight + 4);
    
    // Sidebar can be either deep tone or matched
    const sidebarLight = Math.max(3, bgLight - 2);
    sidebarHex = hslToHex(bgHue, bgSat + 10, sidebarLight);
    
    textPrimaryHex = '#f8fafc';
    textSecondaryHex = '#94a3b8';
  } else {
    // Light background variations
    const bgHue = baseHue;
    const bgSat = 10 + Math.floor(Math.random() * 20);
    const bgLight = 96 + Math.floor(Math.random() * 3);
    bgHex = hslToHex(bgHue, bgSat, bgLight);
    surfaceHex = '#ffffff';
    
    // Light mode sidebar can be sleek dark or matching primary accent
    const darkSidebar = Math.random() > 0.2;
    if (darkSidebar) {
      sidebarHex = hslToHex((baseHue + 15) % 360, 25, 10);
    } else {
      sidebarHex = hslToHex(baseHue, 35, 15);
    }
    
    textPrimaryHex = '#0f172a';
    textSecondaryHex = '#64748b';
  }

  const borderHex = getBorderColor(bgHex, forceDark);
  const schemeLabel = selectedScheme.charAt(0).toUpperCase() + selectedScheme.slice(1);

  // Apply locked color preservation if current palette exists
  const finalPrimary = locked.primary && current ? current.primary : primaryHex;
  const finalPrimaryHover = locked.primary && current ? current.primaryHover : primaryHoverHex;
  const finalAccent = locked.accent && current ? current.accent : accentHex;
  const finalBackground = locked.background && current ? current.background : bgHex;
  const finalSurface = locked.surface && current ? current.surface : surfaceHex;
  const finalSidebar = locked.sidebar && current ? current.sidebar : sidebarHex;
  const finalTextPrimary = locked.textPrimary && current ? current.textPrimary : textPrimaryHex;

  return {
    name: `Custom ${schemeLabel} (${finalPrimary})`,
    primary: finalPrimary,
    primaryHover: finalPrimaryHover,
    accent: finalAccent,
    background: finalBackground,
    surface: finalSurface,
    sidebar: finalSidebar,
    textPrimary: finalTextPrimary,
    textSecondary: locked.textPrimary && current ? current.textSecondary : textSecondaryHex,
    border: locked.background && current ? current.border : borderHex,
    isDark: locked.background && current ? current.isDark : forceDark,
  };
}

// Preset Themes Collection (15 Curated Themes)
export const PRESET_THEMES: ThemePalette[] = [
  DEFAULT_THEME_PALETTE,
  {
    name: 'Cyberpunk Neon',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    accent: '#f43f5e',
    background: '#090d16',
    surface: '#0f172a',
    sidebar: '#05070e',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#1e293b',
    isDark: true,
  },
  {
    name: 'Emerald Pitch',
    primary: '#10b981',
    primaryHover: '#059669',
    accent: '#f59e0b',
    background: '#062016',
    surface: '#0d2d20',
    sidebar: '#04160e',
    textPrimary: '#ecfdf5',
    textSecondary: '#a7f3d0',
    border: '#164e38',
    isDark: true,
  },
  {
    name: 'Royal Gold',
    primary: '#d97706',
    primaryHover: '#b45309',
    accent: '#3b82f6',
    background: '#12100e',
    surface: '#1c1917',
    sidebar: '#0a0908',
    textPrimary: '#fafaf9',
    textSecondary: '#a8a29e',
    border: '#292524',
    isDark: true,
  },
  {
    name: 'Sunset Crimson',
    primary: '#e11d48',
    primaryHover: '#be123c',
    accent: '#f59e0b',
    background: '#18090c',
    surface: '#240d12',
    sidebar: '#0f0507',
    textPrimary: '#fff1f2',
    textSecondary: '#fca5a5',
    border: '#38121a',
    isDark: true,
  },
  {
    name: 'Clean Light',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    accent: '#06b6d4',
    background: '#f8fafc',
    surface: '#ffffff',
    sidebar: '#1e1b4b',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    isDark: false,
  },
  {
    name: 'Nordic Slate',
    primary: '#0284c7',
    primaryHover: '#0369a1',
    accent: '#38bdf8',
    background: '#0f172a',
    surface: '#1e293b',
    sidebar: '#090d16',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    isDark: true,
  },
  {
    name: 'Tokyo Midnight',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    accent: '#ec4899',
    background: '#130d24',
    surface: '#1d1536',
    sidebar: '#0b0716',
    textPrimary: '#f5f3ff',
    textSecondary: '#c4b5fd',
    border: '#2e234e',
    isDark: true,
  },
  {
    name: 'Deep Ocean',
    primary: '#0284c7',
    primaryHover: '#0369a1',
    accent: '#14b8a6',
    background: '#041724',
    surface: '#092538',
    sidebar: '#020e17',
    textPrimary: '#f0f9ff',
    textSecondary: '#7dd3fc',
    border: '#113a56',
    isDark: true,
  },
  {
    name: 'Volcanic Lava',
    primary: '#ea580c',
    primaryHover: '#c2410c',
    accent: '#eab308',
    background: '#1a0c06',
    surface: '#29140b',
    sidebar: '#0f0603',
    textPrimary: '#fff7ed',
    textSecondary: '#fdba74',
    border: '#431f10',
    isDark: true,
  },
  {
    name: 'Matrix Hacker',
    primary: '#22c55e',
    primaryHover: '#16a34a',
    accent: '#84cc16',
    background: '#041408',
    surface: '#0a2310',
    sidebar: '#020b04',
    textPrimary: '#f0fdf4',
    textSecondary: '#86efac',
    border: '#143d1c',
    isDark: true,
  },
  {
    name: 'Pastel Dream',
    primary: '#a855f7',
    primaryHover: '#9333ea',
    accent: '#06b6d4',
    background: '#faf5ff',
    surface: '#ffffff',
    sidebar: '#3b0764',
    textPrimary: '#2e1065',
    textSecondary: '#7e22ce',
    border: '#f3e8ff',
    isDark: false,
  },
  {
    name: 'Golden Hour',
    primary: '#d97706',
    primaryHover: '#b45309',
    accent: '#ea580c',
    background: '#fffbeb',
    surface: '#ffffff',
    sidebar: '#451a03',
    textPrimary: '#451a03',
    textSecondary: '#b45309',
    border: '#fef3c7',
    isDark: false,
  },
  {
    name: 'Minimal Charcoal',
    primary: '#f8fafc',
    primaryHover: '#e2e8f0',
    accent: '#38bdf8',
    background: '#09090b',
    surface: '#18181b',
    sidebar: '#000000',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    border: '#27272a',
    isDark: true,
  },
  {
    name: 'Lavender Bliss',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    accent: '#f43f5e',
    background: '#fcf5ff',
    surface: '#ffffff',
    sidebar: '#2e1065',
    textPrimary: '#1e1b4b',
    textSecondary: '#6b21a8',
    border: '#f3e8ff',
    isDark: false,
  },
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
