'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RumorsListView from '@/views/rumors/RumorsListView';
import RumorEditorView from '@/views/rumors/RumorEditorView';

function RumorsContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  return editId ? <RumorEditorView key={editId} rumorId={editId} /> : <RumorsListView key="list" />;
}

export default function RumorsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat rumor...</div>}>
      <RumorsContent />
    </Suspense>
  );
}
