'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RumorsListView from '@/components/rumors/RumorsListView';
import RumorEditorView from '@/components/rumors/RumorEditorView';

function RumorsContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  return editId ? <RumorEditorView rumorId={editId} /> : <RumorsListView />;
}

export default function RumorsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat rumor...</div>}>
      <RumorsContent />
    </Suspense>
  );
}
