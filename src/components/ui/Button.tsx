import React from 'react';
import { cn, type Size, type Variant } from '@/lib/ui';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:   'btn btn-primary',
  secondary: 'btn btn-secondary',
  danger:    'btn btn-danger',
  ghost:     'btn btn-ghost',
  outline:   'btn btn-outline',
};

const sizeClass: Record<Size, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, loadingLabel, leftIcon, rightIcon, fullWidth, className, children, disabled, style, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(variantClass[variant], sizeClass[size], className)}
      disabled={disabled || loading}
      style={{ width: fullWidth ? '100%' : undefined, ...style }}
      {...props}
    >
      {loading ? (
        <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />{loadingLabel || children}</>
      ) : (
        <>{leftIcon}{children}{rightIcon}</>
      )}
    </button>
  )
);
Button.displayName = 'Button';
