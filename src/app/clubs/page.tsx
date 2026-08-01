'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClubsListView from '@/views/clubs/ClubsListView';
import ClubEditorView from '@/views/clubs/ClubEditorView';

function ClubsContent() {
  return <ClubsListView />;
}

export default function ClubsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat klub...</div>}>
      <ClubsContent />
    </Suspense>
  );
}
