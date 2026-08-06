import React from 'react';
import { cn } from '@/lib/ui';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> { gap?: number; }
export const Stack: React.FC<StackProps> = ({ gap = 16, className, style, children, ...props }) => (
  <div className={cn(className)} style={{ display: 'flex', flexDirection: 'column', gap, ...style }} {...props}>{children}</div>
);

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number; wrap?: boolean;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
}
export const Row: React.FC<RowProps> = ({ gap = 8, wrap, align = 'center', justify, className, style, children, ...props }) => (
  <div className={cn(className)} style={{ display: 'flex', alignItems: align, justifyContent: justify, gap, flexWrap: wrap ? 'wrap' : undefined, ...style }} {...props}>{children}</div>
);

interface GridProps extends React.HTMLAttributes<HTMLDivElement> { cols?: 1 | 2 | 3 | 4 | 6 | 12; gap?: number; }
export const Grid: React.FC<GridProps> = ({ cols = 2, gap = 16, className, style, children, ...props }) => (
  <div className={cn(className)} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, ...style }} {...props}>{children}</div>
);

export const Divider: React.FC<{ label?: string; className?: string }> = ({ label, className }) => (
  <div className={cn(className)} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--neutral-200)' }} />
    {label && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>}
    {label && <div style={{ flex: 1, height: 1, background: 'var(--neutral-200)' }} />}
  </div>
);

interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string; }
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div className={cn('text-center', className)} style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    {icon && <div style={{ color: 'var(--neutral-400)', marginBottom: 4 }}>{icon}</div>}
    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--neutral-800)' }}>{title}</h3>
    {description && <p style={{ fontSize: 13, color: 'var(--neutral-500)', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>{description}</p>}
    {action}
  </div>
);

interface PageHeaderProps { breadcrumb?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string; }
export const PageHeader: React.FC<PageHeaderProps> = ({ breadcrumb, title, description, action, className }) => (
  <div className={cn('page-header', className)}>
    <div>
      {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
