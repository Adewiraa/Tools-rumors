import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyle = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variants = {
    default: 'border-transparent bg-primary-600 text-white shadow hover:bg-primary-700',
    secondary: 'border-transparent bg-neutral-200 text-neutral-800 hover:bg-neutral-300',
    destructive: 'border-transparent bg-danger-600 text-white shadow hover:bg-red-700',
    outline: 'text-neutral-700 border-neutral-300 hover:bg-neutral-100',
    success: 'border-transparent bg-success-600 text-white shadow hover:bg-green-700',
    warning: 'border-transparent bg-warning-600 text-white shadow hover:bg-amber-700',
    info: 'border-transparent bg-info-600 text-white shadow hover:bg-slate-700',
  };

  return (
    <div className={cn(baseStyle, variants[variant], className)} {...props} />
  );
}

export { Badge };
