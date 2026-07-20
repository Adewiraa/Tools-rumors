'use client';

import React, { useState } from 'react';
import { useApp, UserRole } from '@/logic/AppContext';
import { ChevronRight, Save, Upload } from 'lucide-react';
import type { AppSettings } from '@/logic/utils';

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error && error.message ? error.message : fallback
);

export default function SettingsView() {
  const {
    appSettings,
    setAppSettings,
    currentUserRole,
    setCurrentUserRole,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isOffline,
    setIsOffline,
    triggerToast,
  } = useApp();
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const updateIdentityDraft = (field: keyof AppSettings, value: string) => {
    setAppSettings({ ...appSettings, [field]: value });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'brand-logos');
      formData.append('folder', appSettings.appName || 'app-identity');

      const response = await fetch('/api/uploads/logo', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload logo gagal.');
      }

      updateIdentityDraft('appLogoSrc', result.data.publicUrl);
      triggerToast('Logo aplikasi berhasil diupload');
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Logo aplikasi gagal diupload'), 'error');
    } finally {
      setIsUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleSaveIdentity = async () => {
    try {
      setIsSavingIdentity(true);

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: appSettings }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Pengaturan identitas belum tersimpan ke database.');
      }

      setAppSettings(result.data);
      triggerToast('Identitas aplikasi berhasil disimpan');
    } catch (error: unknown) {
      triggerToast(`${getErrorMessage(error, 'Pengaturan identitas belum tersimpan ke database.')} Perubahan tetap tersimpan di browser ini.`, 'warning');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Pengaturan</span></div>
        <h1 className="page-title">Pengaturan</h1>
        <p className="page-description">Master web, akses admin, dan status aplikasi.</p>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Master Web</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', gap: 24, alignItems: 'start', marginTop: 20 }}>
          <div style={{
            width: 168,
            minHeight: 168,
            border: '1px solid var(--neutral-200)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f1515',
            padding: 18,
          }}>
            <img
              src={appSettings.appLogoSrc}
              alt={appSettings.appName}
              style={{ maxWidth: '100%', maxHeight: 118, objectFit: 'contain' }}
            />
          </div>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nama Aplikasi</label>
                <input
                  className="form-input"
                  value={appSettings.appName}
                  onChange={event => updateIdentityDraft('appName', event.target.value)}
                  placeholder="Contoh: Gosball"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle Sidebar</label>
                <input
                  className="form-input"
                  value={appSettings.appSubtitle}
                  onChange={event => updateIdentityDraft('appSubtitle', event.target.value)}
                  placeholder="Contoh: MEDIA APP"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Handle Watermark</label>
                <input
                  className="form-input"
                  value={appSettings.appHandle}
                  onChange={event => updateIdentityDraft('appHandle', event.target.value)}
                  placeholder="Contoh: @GOSBALL"
                />
              </div>
              <div className="form-group">
                <label className="form-label">URL Logo</label>
                <input
                  className="form-input"
                  value={appSettings.appLogoSrc}
                  onChange={event => updateIdentityDraft('appLogoSrc', event.target.value)}
                  placeholder="/brand/gosball-alt.png"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
              <label className="btn btn-secondary" style={{ cursor: isUploadingLogo ? 'wait' : 'pointer' }}>
                <Upload size={16} />
                {isUploadingLogo ? 'Mengupload...' : 'Upload Logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} style={{ display: 'none' }} />
              </label>
              <button className="btn btn-primary" type="button" onClick={handleSaveIdentity} disabled={isSavingIdentity}>
                <Save size={16} />
                {isSavingIdentity ? 'Menyimpan...' : 'Simpan Identitas'}
              </button>
            </div>
          </div>
        </div>
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
