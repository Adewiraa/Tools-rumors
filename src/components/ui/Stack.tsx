import React from 'react';
import { cn } from '@/lib/ui';

// ── Stack — vertical layout helper ───────────────────────────────────────────
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number;
}

/**
 * Stack — vertical flex layout dengan gap konsisten.
 * @example <Stack gap={16}><Input /><Select /><Button>Simpan</Button></Stack>
 */
export const Stack: React.FC<StackProps> = ({ gap = 16, className, style, children, ...props }) => (
  <div
    className={cn(className)}
    style={{ display: 'flex', flexDirection: 'column', gap, ...style }}
    {...props}
  >
    {children}
  </div>
);

// ── Row — horizontal layout helper ───────────────────────────────────────────
interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number;
  wrap?: boolean;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
}

/**
 * Row — horizontal flex layout.
 * @example <Row gap={8} align="center"><Badge /><span>Label</span></Row>
 */
export const Row: React.FC<RowProps> = ({ gap = 8, wrap, align = 'center', justify, className, style, children, ...props }) => (
  <div
    className={cn(className)}
    style={{ display: 'flex', alignItems: align, justifyContent: justify, gap, flexWrap: wrap ? 'wrap' : undefined, ...style }}
    {...props}
  >
    {children}
  </div>
);

// ── Grid — responsive grid layout ─────────────────────────────────────────────
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: number;
}

/**
 * Grid — CSS grid layout dengan kolom yang responsif.
 * @example <Grid cols={2} gap={16}><Input /><Select /></Grid>
 */
export const Grid: React.FC<GridProps> = ({ cols = 2, gap = 16, className, style, children, ...props }) => (
  <div
    className={cn(className)}
    style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, ...style }}
    {...props}
  >
    {children}
  </div>
);

// ── Divider ───────────────────────────────────────────────────────────────────
export const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--neutral-200)' }} />
    {label && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>}
    {label && <div style={{ flex: 1, height: 1, background: 'var(--neutral-200)' }} />}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * EmptyState — tampilan kosong yang konsisten.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    {icon && <div style={{ color: 'var(--neutral-400)', marginBottom: 4 }}>{icon}</div>}
    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--neutral-800)' }}>{title}</h3>
    {description && <p style={{ fontSize: 13, color: 'var(--neutral-500)', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>{description}</p>}
    {action}
  </div>
);

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  breadcrumb?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * PageHeader — header halaman yang konsisten di semua view.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ breadcrumb, title, description, action }) => (
  <div className="page-header">
    <div>
      {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
