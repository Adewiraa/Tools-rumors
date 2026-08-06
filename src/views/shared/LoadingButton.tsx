'use client';

import React from 'react';
import { Button } from '@/components/ui';
import type { ButtonProps } from '@/components/ui';

type LoadingButtonProps = Omit<ButtonProps, 'loading'> & {
  loading?: boolean;
  loadingLabel?: string;
};

export default function LoadingButton({
  loading = false,
  loadingLabel = 'Memproses...',
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} loading={loading} loadingLabel={loadingLabel}>
      {children}
    </Button>
  );
}
