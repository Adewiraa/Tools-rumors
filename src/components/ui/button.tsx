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

/**
 * Button — komponen tombol standar Media Tools.
 *
 * @example
 * <Button variant="primary" size="md" onClick={handleSave}>Simpan</Button>
 * <Button variant="secondary" loading={isSaving} loadingLabel="Menyimpan...">Simpan</Button>
 * <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />}>Hapus</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, loadingLabel, leftIcon, rightIcon, fullWidth, className, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        className={cn(variantClass[variant], sizeClass[size], fullWidth && 'w-full', className)}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            {loadingLabel || children}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
