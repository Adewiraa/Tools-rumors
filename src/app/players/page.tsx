'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PlayersListView from '@/components/players/PlayersListView';
import PlayerEditorView from '@/components/players/PlayerEditorView';

function PlayersContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  return editId ? <PlayerEditorView playerId={editId} /> : <PlayersListView />;
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat pemain...</div>}>
      <PlayersContent />
    </Suspense>
  );
}
