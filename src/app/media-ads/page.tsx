'use client';

import React, { Suspense } from 'react';
import MediaAdsListView from '@/views/media-ads/MediaAdsListView';

export default function MediaAdsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat master iklan...</div>}>
      <MediaAdsListView />
    </Suspense>
  );
}
