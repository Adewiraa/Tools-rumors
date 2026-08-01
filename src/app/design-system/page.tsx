import React from 'react';
import DesignSystemView from '@/views/design-system/DesignSystemView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design System & Components — Gosball Admin',
  description: 'Galeri komponen Shadcn UI + Tailwind CSS v4 untuk Gosball Admin',
};

export default function DesignSystemPage() {
  return <DesignSystemView />;
}
