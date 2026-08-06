import React from 'react';
import { cn } from '@/lib/ui';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'dark' | 'highlight';
  padding?: number | string;
}

/**
 * Card — container konten standar.
 *
 * @example
 * <Card>Konten biasa</Card>
 * <Card variant="compact">Konten compact</Card>
 * <Card variant="dark" className="text-white">Dark card</Card>
 * <Card variant="highlight">Card dengan border primary</Card>
 */
export const Card: React.FC<CardProps> = ({ variant = 'default', padding, className, style, children, ...props }) => {
  const paddingStyle = padding !== undefined ? { padding } : {};
  return (
    <div
      className={cn(
        'card',
        variant === 'compact'   && 'card-compact',
        variant === 'dark'      && 'card-dark',
        variant === 'highlight' && 'card-highlight',
        className
      )}
      style={{ ...paddingStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('card-header', className)} {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('card-title', className)} style={{ fontSize: 16, fontWeight: 700, margin: 0 }} {...props}>
    {children}
  </h3>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('card-body', className)} {...props}>{children}</div>
);
