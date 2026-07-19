'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ResultsListView from '@/components/results/ResultsListView';
import ResultEditorView from '@/components/results/ResultEditorView';

function ResultsContent() {
  const searchParams = useSearchParams();
  const editMatchId = searchParams.get('edit');

  if (editMatchId) {
    return <ResultEditorView matchId={editMatchId} />;
  }

  return <ResultsListView />;
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat hasil...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
