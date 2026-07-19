'use client';

import React from 'react';
import { useApp, UserRole } from '@/context/AppContext';
import { ChevronRight } from 'lucide-react';

export default function SettingsView() {
  const {
    currentUserRole,
    setCurrentUserRole,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isOffline,
    setIsOffline,
    triggerToast,
  } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Pengaturan</span></div>
        <h1 className="page-title">Pengaturan</h1>
        <p className="page-description">Simulasi role admin, indikator draft, dan mode offline.</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="form-group">
          <label className="form-label">Role Admin</label>
          <select className="form-select" value={currentUserRole} onChange={event => {
            const role = event.target.value as UserRole;
            setCurrentUserRole(role);
            triggerToast(`Role aktif: ${role}`);
          }}>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin Data">Admin Data</option>
            <option value="Match Editor">Match Editor</option>
            <option value="Rumor Editor">Rumor Editor</option>
            <option value="Reviewer">Reviewer</option>
          </select>
          <span className="form-helper">Role ini memengaruhi tombol aksi dan izin publish di setiap menu.</span>
        </div>

        <div className="form-group" style={{ marginTop: 24, borderTop: '1px solid var(--neutral-200)', paddingTop: 20 }}>
          <label className="form-label">Status Aplikasi</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="flex align-center gap-10">
              <input type="checkbox" checked={hasUnsavedChanges} onChange={event => setHasUnsavedChanges(event.target.checked)} />
              Simulasikan perubahan belum disimpan
            </label>
            <label className="flex align-center gap-10">
              <input type="checkbox" checked={isOffline} onChange={event => setIsOffline(event.target.checked)} />
              Simulasikan mode offline
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
