'use client';

import React, { Suspense } from 'react';
import PlayersListView from '@/views/players/PlayersListView';

export default function PlayersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat pemain...</div>}>
      <PlayersListView />
    </Suspense>
  );
}
