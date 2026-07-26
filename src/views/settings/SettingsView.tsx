'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Save, Upload, Palette, Dices, Sparkles, Moon, Sun, Zap, RotateCcw, Check, Copy, Plus, Layers, Building2, X } from 'lucide-react';
import type { AppSettings } from '@/logic/utils';
import {
  ThemePalette,
  DEFAULT_THEME_PALETTE,
  PRESET_THEMES,
  generateRandomPalette,
  applyThemeToDocument,
  exportCSSVariables,
  RandomMode,
  ColorSchemeType,
} from '@/logic/colorGenerator';

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error && error.message ? error.message : fallback
);

export default function SettingsView() {
  const {
    appSettings,
    setAppSettings,
    currentTheme,
    setCustomTheme,
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

  // New Tenant Modal States
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantHandle, setNewTenantHandle] = useState('');

  // Theme Studio States
  const [activeMode, setActiveMode] = useState<RandomMode>('all');
  const [activeScheme, setActiveScheme] = useState<ColorSchemeType>('all');
  const [draftTheme, setDraftTheme] = useState<ThemePalette>(currentTheme || DEFAULT_THEME_PALETTE);

  useEffect(() => {
    setFormData(appSettings);
  }, [appSettings]);

  useEffect(() => {
    if (currentTheme) {
      setDraftTheme(currentTheme);
    }
  }, [currentTheme]);

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

  // Color Studio Handlers
  const handleRandomize = (modeOverride?: RandomMode, schemeOverride?: ColorSchemeType) => {
    const mode = modeOverride || activeMode;
    const scheme = schemeOverride || activeScheme;
    const newPalette = generateRandomPalette(mode, scheme);
    setDraftTheme(newPalette);
    applyThemeToDocument(newPalette);
  };

  const handleColorChange = (field: keyof ThemePalette, hex: string) => {
    const updated = { ...draftTheme, [field]: hex };
    setDraftTheme(updated);
    applyThemeToDocument(updated);
  };

  const handleSelectPreset = (preset: ThemePalette) => {
    setDraftTheme(preset);
    applyThemeToDocument(preset);
    triggerToast(`Tema "${preset.name}" diterapkan!`, 'success');
  };

  const handleSaveTheme = () => {
    setCustomTheme(draftTheme);
    logAction('UPDATE_THEME', 'Pengaturan', `Memperbarui tema warna aplikasi`);
    triggerToast('Skema warna berhasil disimpan!', 'success');
  };

  const handleResetTheme = () => {
    setDraftTheme(DEFAULT_THEME_PALETTE);
    setCustomTheme(DEFAULT_THEME_PALETTE);
    applyThemeToDocument(DEFAULT_THEME_PALETTE);
    triggerToast('Warna dikembalikan ke default!', 'success');
  };

  const handleAddTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    const slug = newTenantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tenantId = `tenant-${slug}-${Date.now().toString(36).slice(-4)}`;

    const newTenant = {
      id: tenantId,
      name: newTenantName.trim(),
      logoSrc: '/brand/gosball-alt.png',
      subtitle: 'Media Sepak Bola',
      handle: newTenantHandle.trim() || `@${slug}`,
    };

    await addTenant(newTenant);
    logAction('ADD_MEDIA_TENANT', 'Pengaturan', `Menambahkan Media Tenant Baru: ${newTenant.name}`);
    triggerToast(`Media "${newTenant.name}" berhasil ditambahkan!`, 'success');
    setShowAddTenantModal(false);
    setNewTenantName('');
    setNewTenantHandle('');
  };

  return (
    <div className="settings-page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>Pengaturan</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 24 }}>Pengaturan Sistem</h1>
          <p className="page-description" style={{ fontSize: 13, marginTop: 2 }}>Kelola master identitas web dan visualisasi warna tema secara realtime.</p>
        </div>
      </div>

      {/* Media Workspace Selector Bar */}
      <div className="card" style={{ padding: 14, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={18} style={{ color: 'var(--primary-600)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--neutral-950)' }}>Media Tenant Workspace</div>
            <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>Pilih media aktif untuk mengelola identitas web dan visualnya.</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {mediaTenants.map(tenant => {
            const isActive = tenant.id === currentTenantId;
            return (
              <button
                key={tenant.id}
                onClick={() => switchTenant(tenant.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontWeight: isActive ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                {isActive && <Check size={13} />}
                <span>{tenant.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowAddTenantModal(true)}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, borderStyle: 'dashed' }}
          >
            <Plus size={13} />
            <span>Tambah Media</span>
          </button>
        </div>
      </div>

      {/* 2-Column Compact Settings Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
        
        {/* Left Column: Identitas Aplikasi (Master Web) */}
        <div className="card settings-card" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
              Identitas Aplikasi ({appSettings.appName})
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--neutral-950)' }}>Master Web</h3>
            <p className="page-description" style={{ marginTop: 2, fontSize: 12 }}>Logo, nama, subtitle & handle watermark.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Logo Preview */}
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

            {/* Inputs */}
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

        {/* Right Column: Realtime Color Studio & Harmony Generator */}
        <div className="card settings-card" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={13} /> Visualisasi Warna & Tema
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--neutral-950)' }}>Realtime Color Studio</h3>
            </div>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                const code = exportCSSVariables(draftTheme);
                navigator.clipboard.writeText(code);
                triggerToast('Kode CSS berhasil disalin!', 'success');
              }}
              style={{ gap: 4, fontSize: 11, padding: '4px 10px', height: 28 }}
            >
              <Copy size={12} /> Salin Kode CSS
            </button>
          </div>

          {/* Randomizer Control Box */}
          <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
            
            {/* Color Scheme Harmonies Dropdown Selector */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--neutral-800)', marginBottom: 4 }}>
                Select a Color Scheme (Harmoni Warna):
              </label>
              <select
                className="form-select"
                value={activeScheme}
                onChange={e => {
                  const scheme = e.target.value as ColorSchemeType;
                  setActiveScheme(scheme);
                  handleRandomize(activeMode, scheme);
                }}
                style={{ width: '100%', fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 6 }}
              >
                <option value="all">All (Random Harmony) — Harmoni warna acak</option>
                <option value="monochromatic">Monochromatic — Satu nada warna (variasi saturasi/terang)</option>
                <option value="analogous">Analogous — Warna bersebelahan pada roda warna</option>
                <option value="complementary">Complementary — Warna berseberangan 180° (kontras dinamis)</option>
                <option value="split-complementary">Split Complementary — Kontras lembut terpisah 150°/210°</option>
                <option value="triadic">Triadic — Tiga warna seimbang 120° (enerjik)</option>
                <option value="tetradic">Tetradic — Empat warna berpasangan 90°/270° (kaya kontras)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => handleRandomize()}
                className="btn"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)',
                }}
              >
                <Dices size={18} />
                <span>🎲 Randomize Palette!</span>
              </button>

              {/* Mode Toggles */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className={`btn btn-sm ${activeMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('all'); handleRandomize('all'); }}
                  style={{ fontSize: 10, padding: '4px 8px', height: 32 }}
                  title="Bebas Acak"
                >
                  <Sparkles size={11} /> All
                </button>
                <button
                  className={`btn btn-sm ${activeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('dark'); handleRandomize('dark'); }}
                  style={{ fontSize: 10, padding: '4px 8px', height: 32 }}
                  title="Dark Mode Only"
                >
                  <Moon size={11} /> Dark
                </button>
                <button
                  className={`btn btn-sm ${activeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('light'); handleRandomize('light'); }}
                  style={{ fontSize: 10, padding: '4px 8px', height: 32 }}
                  title="Light Mode Only"
                >
                  <Sun size={11} /> Light
                </button>
                <button
                  className={`btn btn-sm ${activeMode === 'vibrant' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('vibrant'); handleRandomize('vibrant'); }}
                  style={{ fontSize: 10, padding: '4px 8px', height: 32 }}
                  title="Vibrant Neon"
                >
                  <Zap size={11} /> Neon
                </button>
              </div>
            </div>
          </div>

          {/* Live Mini App UI Preview */}
          <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: draftTheme.background, border: `1px solid ${draftTheme.border}`, color: draftTheme.textPrimary }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, opacity: 0.85 }}>
              ✨ Live Mini UI Preview (Pratinjau Realtime):
            </div>

            <div style={{ display: 'flex', height: 80, borderRadius: 6, overflow: 'hidden', border: `1px solid ${draftTheme.border}`, background: draftTheme.surface }}>
              <div style={{ width: 36, background: draftTheme.sidebar, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: draftTheme.primary }} />
                <div style={{ width: 20, height: 3, borderRadius: 2, background: draftTheme.accent }} />
              </div>

              <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, background: draftTheme.background }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: draftTheme.textPrimary }}>Media Tools Portal</div>
                  <div style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: draftTheme.accent, color: '#fff', fontWeight: 700 }}>Active</div>
                </div>

                <div style={{ padding: 6, borderRadius: 4, background: draftTheme.surface, border: `1px solid ${draftTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: draftTheme.textPrimary }}>Hasil Match #102</div>
                    <div style={{ fontSize: 8, color: draftTheme.textSecondary }}>Persib vs Arema</div>
                  </div>
                  <div style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, background: draftTheme.primary, color: '#ffffff', fontWeight: 700 }}>
                    Button
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fine-Tune Manual Color Pickers */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neutral-800)', marginBottom: 8 }}>Fine-Tune Warna 6 Elemen UI:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              
              {/* Primary Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, borderRadius: 6, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                <input type="color" value={draftTheme.primary} onChange={e => handleColorChange('primary', e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-900)' }}>Primary</div>
                  <input
                    type="text"
                    value={draftTheme.primary}
                    onChange={e => handleColorChange('primary', e.target.value)}
                    style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', padding: '1px 3px', border: '1px solid var(--neutral-300)', borderRadius: 3, background: 'var(--white)', color: 'var(--neutral-900)' }}
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, borderRadius: 6, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                <input type="color" value={draftTheme.accent} onChange={e => handleColorChange('accent', e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-900)' }}>Accent</div>
                  <input
                    type="text"
                    value={draftTheme.accent}
                    onChange={e => handleColorChange('accent', e.target.value)}
                    style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', padding: '1px 3px', border: '1px solid var(--neutral-300)', borderRadius: 3, background: 'var(--white)', color: 'var(--neutral-900)' }}
                  />
                </div>
              </div>

              {/* Background Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, borderRadius: 6, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                <input type="color" value={draftTheme.background} onChange={e => handleColorChange('background', e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-900)' }}>Background</div>
                  <input
                    type="text"
                    value={draftTheme.background}
                    onChange={e => handleColorChange('background', e.target.value)}
                    style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', padding: '1px 3px', border: '1px solid var(--neutral-300)', borderRadius: 3, background: 'var(--white)', color: 'var(--neutral-900)' }}
                  />
                </div>
              </div>

              {/* Card Surface Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, borderRadius: 6, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                <input type="color" value={draftTheme.surface} onChange={e => handleColorChange('surface', e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-900)' }}>Surface</div>
                  <input
                    type="text"
                    value={draftTheme.surface}
                    onChange={e => handleColorChange('surface', e.target.value)}
                    style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', padding: '1px 3px', border: '1px solid var(--neutral-300)', borderRadius: 3, background: 'var(--white)', color: 'var(--neutral-900)' }}
                  />
                </div>
              </div>

              {/* Sidebar Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, borderRadius: 6, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                <input type="color" value={draftTheme.sidebar} onChange={e => handleColorChange('sidebar', e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-900)' }}>Sidebar</div>
                  <input
                    type="text"
                    value={draftTheme.sidebar}
                    onChange={e => handleColorChange('sidebar', e.target.value)}
                    style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', padding: '1px 3px', border: '1px solid var(--neutral-300)', borderRadius: 3, background: 'var(--white)', color: 'var(--neutral-900)' }}
                  />
                </div>
              </div>

              {/* Text Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, borderRadius: 6, background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                <input type="color" value={draftTheme.textPrimary} onChange={e => handleColorChange('textPrimary', e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-900)' }}>Text Main</div>
                  <input
                    type="text"
                    value={draftTheme.textPrimary}
                    onChange={e => handleColorChange('textPrimary', e.target.value)}
                    style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', padding: '1px 3px', border: '1px solid var(--neutral-300)', borderRadius: 3, background: 'var(--white)', color: 'var(--neutral-900)' }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Presets Slider / Grid */}
          <div style={{ marginBottom: 14, borderTop: '1px solid var(--neutral-200)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neutral-800)', marginBottom: 8 }}>Presets Terkurasi ({PRESET_THEMES.length}):</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {PRESET_THEMES.slice(0, 10).map(preset => {
                const isSelected = draftTheme.name === preset.name || (draftTheme.primary === preset.primary && draftTheme.background === preset.background);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--neutral-200)',
                      background: preset.background,
                      color: preset.textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      alignItems: 'flex-start',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: preset.primary }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: preset.accent }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: preset.sidebar }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-200)', paddingTop: 12 }}>
            <button className="btn btn-sm btn-secondary" onClick={handleResetTheme} style={{ gap: 4, fontSize: 11 }}>
              <RotateCcw size={12} /> Reset Default
            </button>

            <button className="btn btn-sm btn-primary" onClick={handleSaveTheme} style={{ gap: 4, fontSize: 11 }}>
              <Check size={13} /> Simpan Skema Warna
            </button>
          </div>
        </div>

      </div>

      {/* Modal Tambah Media Tenant */}
      {showAddTenantModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="modal-content" style={{ background: 'var(--white)', color: 'var(--neutral-950)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--neutral-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Tambah Media Tenant Baru</h3>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowAddTenantModal(false)} style={{ padding: 4, borderRadius: '50%' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTenantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Nama Media / Aplikasi *</label>
                <input
                  className="form-input"
                  required
                  value={newTenantName}
                  onChange={e => setNewTenantName(e.target.value)}
                  placeholder="Contoh: Garuda Goal / Bola Nusantara"
                  style={{ fontSize: 13, padding: '8px 12px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Handle Watermark</label>
                <input
                  className="form-input"
                  value={newTenantHandle}
                  onChange={e => setNewTenantHandle(e.target.value)}
                  placeholder="Contoh: @garudagoal"
                  style={{ fontSize: 13, padding: '8px 12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddTenantModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-sm btn-primary" style={{ gap: 6 }}>
                  <Plus size={14} /> Buat Media Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
