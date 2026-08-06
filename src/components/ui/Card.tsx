import React from 'react';
import { cn } from '@/lib/ui';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'dark' | 'highlight';
  padding?: number | string;
}

export const Card: React.FC<CardProps> = ({ variant = 'default', padding, className, style, children, ...props }) => (
  <div
    className={cn('card', variant === 'compact' && 'card-compact', variant === 'dark' && 'card-dark', variant === 'highlight' && 'card-highlight', className)}
    style={{ ...(padding !== undefined ? { padding } : {}), ...style }}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('card-header flex flex-col gap-1 pb-4', className)} {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('card-title font-bold leading-snug', className)} style={{ fontSize: 16, margin: 0 }} {...props}>{children}</h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-neutral-500', className)} style={{ margin: 0 }} {...props}>{children}</p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('card-body', className)} {...props}>{children}</div>
);

export const CardBody = CardContent;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex items-center pt-4 border-t border-neutral-100 mt-4 gap-2', className)} {...props}>{children}</div>
);
