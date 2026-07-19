'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClubsListView from '@/components/clubs/ClubsListView';
import ClubEditorView from '@/components/clubs/ClubEditorView';

function ClubsContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  return editId ? <ClubEditorView clubId={editId} /> : <ClubsListView />;
}

export default function ClubsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat klub...</div>}>
      <ClubsContent />
    </Suspense>
  );
}
