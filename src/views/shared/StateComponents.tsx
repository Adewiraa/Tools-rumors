import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DatabaseIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
    <path d="M3 12A9 3 0 0 0 21 12"></path>
  </svg>
);

export const SkeletonLoading = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ height: 40, width: 300, backgroundColor: 'var(--neutral-200)', borderRadius: 4 }}></div>
      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 4', height: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 16, width: '40%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 32, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
        <div className="card" style={{ gridColumn: 'span 4', height: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 16, width: '40%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 32, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
        <div className="card" style={{ gridColumn: 'span 4', height: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 16, width: '40%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 32, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
      </div>
      <div className="table-wrapper" style={{ height: 300, backgroundColor: 'var(--neutral-100)' }}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 20, width: '100%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 20, width: '90%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 20, width: '95%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 20, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
      </div>
    </div>
  );
};

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: 24 }}>
      <AlertTriangle size={48} color="var(--danger-600)" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Gagal Memuat Data</h2>
      <p style={{ color: 'var(--neutral-700)', maxWidth: 400, marginBottom: 24 }}>
        Terjadi masalah koneksi ke server atau database Supabase. Silakan periksa jaringan Anda atau coba lagi beberapa saat.
      </p>
      <button className="btn btn-md btn-primary" onClick={onRetry}>
        Coba Lagi
      </button>
    </div>
  );
};
