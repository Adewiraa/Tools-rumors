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
    logAction,
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
      logAction('UPLOAD_APP_LOGO', 'Pengaturan', `Mengupload logo aplikasi: ${file.name}`);
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
      logAction('UPDATE_APP_SETTINGS', 'Pengaturan', `Menyimpan identitas aplikasi: ${result.data.appName || appSettings.appName}`);
      triggerToast('Identitas aplikasi berhasil disimpan');
    } catch (error: unknown) {
      triggerToast(`${getErrorMessage(error, 'Pengaturan identitas belum tersimpan ke database.')} Perubahan tetap tersimpan di browser ini.`, 'warning');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  return (
    <div className="settings-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>Pengaturan</span>
          </div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-description">Kelola identitas master aplikasi, role akses aktif, dan status sistem.</p>
        </div>
      </div>

      {/* ── Master Web Card ── */}
      <div className="card settings-card settings-identity-card" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Identitas Aplikasi
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--neutral-950)' }}>Master Web</h3>
          <p className="page-description" style={{ marginTop: 2 }}>Logo, nama, subtitle, dan handle watermark pada setiap konten.</p>
        </div>

        <div className="settings-identity-layout" style={{ display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
          {/* Logo Preview */}
          <div className="settings-logo-panel">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Preview Logo</div>
            <div style={{
              width: 168,
              minHeight: 168,
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              padding: 18,
            }}>
              <img
                src={appSettings.appLogoSrc}
                alt={appSettings.appName}
                style={{ maxWidth: '100%', maxHeight: 118, objectFit: 'contain', background: 'transparent' }}
              />
            </div>
            <label className="btn btn-sm btn-secondary" style={{ cursor: isUploadingLogo ? 'wait' : 'pointer', marginTop: 10, width: '100%', justifyContent: 'center' }}>
              <Upload size={14} />
              {isUploadingLogo ? 'Mengupload...' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Form Fields */}
          <div>
            <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
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
            </div>

            <div className="settings-form-actions" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--neutral-200)' }}>
              <button className="btn btn-md btn-primary settings-save-button" type="button" onClick={handleSaveIdentity} disabled={isSavingIdentity}>
                <Save size={16} />
                {isSavingIdentity ? 'Menyimpan...' : 'Simpan Identitas'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Role & Status Card ── */}
      <div className="card settings-card settings-state-card" style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Akses & Simulasi
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--neutral-950)' }}>Role Admin & Status Sistem</h3>
          <p className="page-description" style={{ marginTop: 2 }}>Pengaturan role aktif dan simulasi status aplikasi untuk pengujian.</p>
        </div>

        <div className="form-group">
          <label className="form-label">Role Admin Aktif</label>
          <select className="form-select" value={currentUserRole} onChange={event => {
            const role = event.target.value as UserRole;
            setCurrentUserRole(role);
            logAction('UPDATE_ACTIVE_ROLE', 'Pengaturan', `Mengubah role aktif menjadi ${role}`);
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
          <label className="form-label">Simulasi Status Aplikasi</label>
          <div className="settings-toggle-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--neutral-700)' }}>
              <input type="checkbox" checked={hasUnsavedChanges} onChange={event => {
                setHasUnsavedChanges(event.target.checked);
                logAction('TOGGLE_SYSTEM_SIMULATION', 'Pengaturan', `Simulasi perubahan belum disimpan: ${event.target.checked ? 'aktif' : 'nonaktif'}`);
              }} />
              Simulasikan perubahan belum disimpan
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--neutral-700)' }}>
              <input type="checkbox" checked={isOffline} onChange={event => {
                setIsOffline(event.target.checked);
                logAction('TOGGLE_SYSTEM_SIMULATION', 'Pengaturan', `Simulasi mode offline: ${event.target.checked ? 'aktif' : 'nonaktif'}`);
              }} />
              Simulasikan mode offline
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
