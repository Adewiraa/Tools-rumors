/**
 * Media Tools — UI Utility Library
 * Single source of truth untuk class merging, token access, dan type helpers.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ── Class merging ─────────────────────────────────────────────────────────────
/**
 * Gabungkan Tailwind classes dengan aman. Handles conflicts otomatis.
 * @example cn('px-4 py-2', isActive && 'bg-primary-600', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Design Tokens ─────────────────────────────────────────────────────────────
/**
 * Token warna standar aplikasi.
 * Selalu gunakan token ini, bukan hardcode hex value.
 */
export const tokens = {
  color: {
    primary:   'var(--primary-600)',
    primaryHover: 'var(--primary-700)',
    primaryLight: 'var(--primary-50)',
    danger:    'var(--danger-600)',
    success:   'var(--success-600)',
    warning:   'var(--warning-600)',
    info:      'var(--info-600)',
    navy950:   'var(--navy-950)',
    navy900:   'var(--navy-900)',
    navy800:   'var(--navy-800)',
    neutral50:  'var(--neutral-50)',
    neutral100: 'var(--neutral-100)',
    neutral200: 'var(--neutral-200)',
    neutral300: 'var(--neutral-300)',
    neutral500: 'var(--neutral-500)',
    neutral700: 'var(--neutral-700)',
    white:     'var(--white)',
    accent:    'var(--accent-500)',
  },
  radius: {
    sm:   'var(--radius-sm)',
    md:   'var(--radius-md)',
    lg:   'var(--radius-lg)',
    full: 'var(--radius-full)',
  },
  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },
  font: {
    sans: 'var(--font-sans)',
  },
} as const;

// ── Spacing scale (px values matching design) ─────────────────────────────────
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

// ── Component size variants ────────────────────────────────────────────────────
export type Size = 'xs' | 'sm' | 'md' | 'lg';
export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type Status = 'success' | 'warning' | 'danger' | 'info' | 'draft' | 'live';

// ── Status → CSS class mapping ────────────────────────────────────────────────
export const statusBadgeClass: Record<Status, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  info:    'badge-info',
  draft:   'badge-draft',
  live:    'badge-live',
};

// ── Button class builder ──────────────────────────────────────────────────────
export function buildBtnClass(variant: Variant = 'primary', size: Size = 'md', extra?: string): string {
  const base = 'btn';
  const v = `btn-${variant}`;
  const s = `btn-${size}`;
  return cn(base, v, s, extra);
}

// ── Responsive grid helper ────────────────────────────────────────────────────
/**
 * Buat inline style untuk responsive grid.
 * Mobile: 1 kolom. Tablet: 2 kolom. Desktop: n kolom.
 * @example gridStyle(3) → { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }
 */
export function gridStyle(
  desktopCols: number,
  tabletCols?: number,
  gap: number = 16
): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${desktopCols}, 1fr)`,
    gap,
  };
}

// ── Form field wrapper style ──────────────────────────────────────────────────
export const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  margin: 0,
};

// ── Card style presets ────────────────────────────────────────────────────────
export const cardStyle = {
  base: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--neutral-200)',
    boxShadow: 'var(--shadow-sm)',
    padding: 20,
  } as React.CSSProperties,
  compact: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--neutral-200)',
    padding: 12,
  } as React.CSSProperties,
  dark: {
    background: 'var(--navy-950)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--navy-800)',
    padding: 20,
    color: 'var(--white)',
  } as React.CSSProperties,
} as const;

// ── Typography presets ────────────────────────────────────────────────────────
export const textStyle = {
  pageTitle:   { fontSize: 24, fontWeight: 800, color: 'var(--neutral-950)', margin: 0 } as React.CSSProperties,
  sectionTitle:{ fontSize: 16, fontWeight: 700, color: 'var(--neutral-950)', margin: 0 } as React.CSSProperties,
  label:       { fontSize: 12, fontWeight: 600, color: 'var(--neutral-700)' } as React.CSSProperties,
  helper:      { fontSize: 11, color: 'var(--neutral-500)' } as React.CSSProperties,
  muted:       { fontSize: 12, color: 'var(--neutral-500)' } as React.CSSProperties,
  caption:     { fontSize: 10, color: 'var(--neutral-400)', letterSpacing: '0.04em', textTransform: 'uppercase' as const },
} as const;

// Re-export React for CSSProperties usage
import type React from 'react';
