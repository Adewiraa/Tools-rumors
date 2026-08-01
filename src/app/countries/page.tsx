'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClubsListView from '@/views/clubs/ClubsListView';
import ClubEditorView from '@/views/clubs/ClubEditorView';

function CountriesContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  return editId ? (
    <ClubEditorView clubId={editId} isNationalTeam={true} />
  ) : (
    <ClubsListView isNationalTeam={true} />
  );
}

export default function CountriesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat negara...</div>}>
      <CountriesContent />
    </Suspense>
  );
}
