'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Save, Upload } from 'lucide-react';
import type { AppSettings } from '@/logic/utils';

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error && error.message ? error.message : fallback
);

export default function SettingsView() {
  const {
    appSettings,
    setAppSettings,
    triggerToast,
    logAction,
  } = useApp();

  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    setFormData(appSettings);
  }, [appSettings]);

  const updateIdentityDraft = (field: keyof AppSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('bucket', 'brand-logos');
      formDataUpload.append('folder', formData.appName || 'app-identity');

      const response = await fetch('/api/uploads/logo', { method: 'POST', body: formDataUpload });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload logo gagal.');
      }

      const updated = { ...formData, appLogoSrc: result.data.publicUrl };
      setFormData(updated);
      setAppSettings(updated);
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
        body: JSON.stringify({ settings: formData }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Pengaturan identitas belum tersimpan ke database.');
      }
      setAppSettings(result.data);
      setFormData(result.data);
      logAction('UPDATE_APP_SETTINGS', 'Pengaturan', `Menyimpan identitas aplikasi: ${result.data.appName || formData.appName}`);
      triggerToast('Identitas aplikasi berhasil disimpan');
    } catch (error: unknown) {
      setAppSettings(formData);
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
          <p className="page-description">Kelola identitas master aplikasi.</p>
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
                src={formData.appLogoSrc}
                alt={formData.appName}
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
                  value={formData.appName}
                  onChange={event => updateIdentityDraft('appName', event.target.value)}
                  placeholder="Contoh: Gosball"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle Sidebar</label>
                <input
                  className="form-input"
                  value={formData.appSubtitle}
                  onChange={event => updateIdentityDraft('appSubtitle', event.target.value)}
                  placeholder="Contoh: MEDIA APP"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Handle Watermark</label>
                <input
                  className="form-input"
                  value={formData.appHandle}
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
    </div>
  );
}


