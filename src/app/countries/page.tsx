'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClubsListView from '@/views/clubs/ClubsListView';
import ClubEditorView from '@/views/clubs/ClubEditorView';

function CountriesContent() {
  return <ClubsListView isNationalTeam={true} />;
}

export default function CountriesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat negara...</div>}>
      <CountriesContent />
    </Suspense>
  );
}
