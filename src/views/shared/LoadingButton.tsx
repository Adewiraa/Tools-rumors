'use client';

import React from 'react';

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
};

export default function LoadingButton({
  loading = false,
  loadingLabel = 'Memproses...',
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : children}
    </button>
  );
}
