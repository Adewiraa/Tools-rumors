'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ScheduleListView from '@/views/schedule/ScheduleListView';
import ScheduleEditorView from '@/views/schedule/ScheduleEditorView';

function ScheduleContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  if (editId) {
    return <ScheduleEditorView matchId={editId} />;
  }

  return <ScheduleListView />;
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat jadwal...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
