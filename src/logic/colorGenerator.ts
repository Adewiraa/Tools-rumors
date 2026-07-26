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

// HSL Helper Functions
function hslToHex(h: number, s: number, l: number): string {
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
  return (brightest + 0.05) / (darkest + 0.05);
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

export type RandomMode = 'all' | 'dark' | 'light' | 'vibrant';

// Infinite Algorithmic Palette Generator
export function generateRandomPalette(mode: RandomMode = 'all'): ThemePalette {
  const forceDark = mode === 'dark' ? true : mode === 'light' ? false : Math.random() > 0.45;
  
  // Random base hue (0 - 360)
  const baseHue = Math.floor(Math.random() * 360);
  
  // Color Harmonies: 0 = Complementary, 1 = Triadic, 2 = Analogous, 3 = Split-Comp
  const harmonyType = Math.floor(Math.random() * 4);
  let accentHue = baseHue;
  if (harmonyType === 0) {
    accentHue = (baseHue + 180) % 360;
  } else if (harmonyType === 1) {
    accentHue = (baseHue + 120) % 360;
  } else if (harmonyType === 2) {
    accentHue = (baseHue + 35) % 360;
  } else {
    accentHue = (baseHue + 150) % 360;
  }

  const primarySat = mode === 'vibrant' ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 30);
  const primaryLight = forceDark ? 50 + Math.floor(Math.random() * 18) : 42 + Math.floor(Math.random() * 18);
  const primaryHex = hslToHex(baseHue, primarySat, primaryLight);
  const primaryHoverHex = hslToHex(baseHue, primarySat, Math.max(20, primaryLight - 8));

  const accentSat = 75 + Math.floor(Math.random() * 25);
  const accentLight = 50 + Math.floor(Math.random() * 15);
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

  return {
    name: `Custom (${primaryHex})`,
    primary: primaryHex,
    primaryHover: primaryHoverHex,
    accent: accentHex,
    background: bgHex,
    surface: surfaceHex,
    sidebar: sidebarHex,
    textPrimary: textPrimaryHex,
    textSecondary: textSecondaryHex,
    border: borderHex,
    isDark: forceDark,
  };
}

// Preset Themes List for Quick Starts
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
];

// Apply Theme Palette to document root CSS variables dynamically
export function applyThemeToDocument(palette: ThemePalette) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Primary color mappings
  root.style.setProperty('--primary-600', palette.primary);
  root.style.setProperty('--primary-500', palette.primary);
  root.style.setProperty('--primary-700', palette.primaryHover);
  
  // Accent mapping
  root.style.setProperty('--accent-500', palette.accent);
  root.style.setProperty('--accent-600', palette.accent);

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
