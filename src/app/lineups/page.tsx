'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LineupsListView from '@/components/lineups/LineupsListView';
import LineupEditorView from '@/components/lineups/LineupEditorView';

function LineupsContent() {
  const searchParams = useSearchParams();
  const editMatchId = searchParams.get('edit');

  if (editMatchId) {
    return <LineupEditorView matchId={editMatchId} />;
  }

  return <LineupsListView />;
}

export default function LineupsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat lineup...</div>}>
      <LineupsContent />
    </Suspense>
  );
}
