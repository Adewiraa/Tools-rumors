'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { Building2, Check, ChevronRight, Plus, Save, Upload, X } from 'lucide-react';
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
    currentTenantId,
    mediaTenants,
    switchTenant,
    addTenant,
  } = useApp();

  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantHandle, setNewTenantHandle] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFormData(appSettings);
    }, 0);

    return () => window.clearTimeout(timer);
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
      formDataUpload.append('folder', formData.appName || currentTenantId || 'app-identity');

      const response = await fetch('/api/uploads/logo', { method: 'POST', body: formDataUpload });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload logo gagal.');
      }

      const updated = { ...formData, tenantId: currentTenantId, appLogoSrc: result.data.publicUrl };
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
    const payload = { ...formData, tenantId: currentTenantId };

    try {
      setIsSavingIdentity(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: currentTenantId, settings: payload }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Pengaturan identitas belum tersimpan ke database.');
      }

      setAppSettings(result.data);
      setFormData(result.data);
      logAction('UPDATE_APP_SETTINGS', 'Pengaturan', `Menyimpan identitas aplikasi: ${result.data.appName || payload.appName}`);
      triggerToast('Identitas aplikasi berhasil disimpan');
    } catch (error: unknown) {
      setAppSettings(payload);
      triggerToast(`${getErrorMessage(error, 'Pengaturan identitas belum tersimpan ke database.')} Perubahan tetap tersimpan di browser ini.`, 'warning');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleAddTenantSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTenantName.trim()) return;

    const slug = newTenantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tenantId = `tenant-${slug || 'media'}-${Date.now().toString(36).slice(-4)}`;
    const newTenant = {
      id: tenantId,
      name: newTenantName.trim(),
      logoSrc: '/brand/gosball-alt.png',
      subtitle: 'Media Sepak Bola',
      handle: newTenantHandle.trim() || `@${slug || 'media'}`,
    };

    await addTenant(newTenant);
    logAction('ADD_MEDIA_TENANT', 'Pengaturan', `Menambahkan media tenant baru: ${newTenant.name}`);
    triggerToast(`Media "${newTenant.name}" berhasil ditambahkan!`, 'success');
    setShowAddTenantModal(false);
    setNewTenantName('');
    setNewTenantHandle('');
  };

  return (
    <div className="settings-page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>Pengaturan</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 24 }}>Pengaturan Sistem</h1>
          <p className="page-description" style={{ fontSize: 13, marginTop: 2 }}>
            Kelola identitas aplikasi untuk media aktif.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="card settings-card" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
              Identitas Aplikasi ({appSettings.appName})
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--neutral-950)' }}>Master Web</h3>
            <p className="page-description" style={{ marginTop: 2, fontSize: 12 }}>Logo, nama, subtitle, dan handle watermark.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 90,
                height: 90,
                border: '1px solid var(--neutral-200)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--neutral-50)',
                padding: 8,
                flexShrink: 0,
              }}>
                <img
                  src={formData.appLogoSrc}
                  alt={formData.appName}
                  style={{ maxWidth: '100%', maxHeight: 74, objectFit: 'contain' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="btn btn-sm btn-secondary" style={{ cursor: isUploadingLogo ? 'wait' : 'pointer', width: '100%', justifyContent: 'center', fontSize: 12, padding: '4px 8px' }}>
                  <Upload size={13} />
                  {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} style={{ display: 'none' }} />
                </label>
                <div style={{ fontSize: 10, color: 'var(--neutral-500)', marginTop: 4, textAlign: 'center' }}>PNG / SVG / WebP (Max 2MB)</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Nama Aplikasi</label>
              <input
                className="form-input"
                value={formData.appName}
                onChange={event => updateIdentityDraft('appName', event.target.value)}
                placeholder="Contoh: Gosball"
                style={{ padding: '6px 10px', fontSize: 13 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Subtitle Sidebar</label>
              <input
                className="form-input"
                value={formData.appSubtitle}
                onChange={event => updateIdentityDraft('appSubtitle', event.target.value)}
                placeholder="Contoh: MEDIA APP"
                style={{ padding: '6px 10px', fontSize: 13 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Handle Watermark</label>
              <input
                className="form-input"
                value={formData.appHandle}
                onChange={event => updateIdentityDraft('appHandle', event.target.value)}
                placeholder="Contoh: @GOSBALL"
                style={{ padding: '6px 10px', fontSize: 13 }}
              />
            </div>

            <button className="btn btn-sm btn-primary" type="button" onClick={handleSaveIdentity} disabled={isSavingIdentity} style={{ width: '100%', marginTop: 4 }}>
              <Save size={14} />
              {isSavingIdentity ? 'Menyimpan...' : 'Simpan Identitas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
