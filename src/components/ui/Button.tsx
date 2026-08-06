import React from 'react';
import { cn } from '@/lib/ui';
import { Loader2 } from 'lucide-react';

// Supports both our internal API (variant: primary/secondary/danger/ghost/outline)
// and shadcn-compatible API (variant: default/secondary/destructive/ghost/outline/icon)
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  | 'default' | 'destructive' | 'icon'; // shadcn aliases
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean; // shadcn compat (ignored, for API compatibility)
}

const variantClass: Record<string, string> = {
  primary:     'btn btn-primary',
  default:     'btn btn-primary',       // shadcn alias
  secondary:   'btn btn-secondary',
  danger:      'btn btn-danger',
  destructive: 'btn btn-danger',        // shadcn alias
  ghost:       'btn btn-ghost',
  outline:     'btn btn-outline',
  icon:        'btn btn-secondary',
};

const sizeClass: Record<string, string> = {
  xs:   'btn-xs',
  sm:   'btn-sm',
  md:   'btn-md',
  lg:   'btn-lg',
  icon: 'btn-icon',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, loadingLabel, leftIcon, rightIcon, fullWidth, className, children, disabled, style, asChild: _asChild, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(variantClass[variant] || 'btn btn-primary', sizeClass[size] || '', className)}
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
