'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CompetitionsListView from '@/views/competitions/CompetitionsListView';
import CompetitionEditorView from '@/views/competitions/CompetitionEditorView';

function CompetitionsContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  return editId ? <CompetitionEditorView competitionId={editId} /> : <CompetitionsListView />;
}

export default function CompetitionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat kompetisi...</div>}>
      <CompetitionsContent />
    </Suspense>
  );
}
