'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Save, Upload, Palette, Dices, Sparkles, Moon, Sun, Zap, RotateCcw, Check, Copy } from 'lucide-react';
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
  } = useApp();

  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
          <p className="page-description">Kelola identitas master aplikasi dan visualisasi warna tema secara realtime.</p>
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

      {/* ── Realtime Color Studio Card ── */}
      <div className="card settings-card settings-theme-card" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={14} /> Visualisasi Warna & Tema
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--neutral-950)' }}>Realtime Color Studio</h3>
            <p className="page-description" style={{ marginTop: 2 }}>Kustomisasi skema warna aplikasi secara realtime dengan generator acak algoritmis atau racik warna sesuai selera.</p>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              const code = exportCSSVariables(draftTheme);
              navigator.clipboard.writeText(code);
              triggerToast('Kode CSS berhasil disalin!', 'success');
            }}
            style={{ gap: 6, fontSize: 12 }}
          >
            <Copy size={14} /> Salin Kode CSS
          </button>
        </div>

        {/* Big Randomize Button + Filters */}
        <div style={{ marginBottom: 24, padding: 18, borderRadius: 'var(--radius-lg)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
          
          {/* Color Scheme Harmonies Dropdown Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--neutral-800)', marginBottom: 6 }}>
              Select a Color Scheme (Pilihan Harmoni Warna):
            </label>
            <select
              className="form-select"
              value={activeScheme}
              onChange={e => {
                const scheme = e.target.value as ColorSchemeType;
                setActiveScheme(scheme);
                handleRandomize(activeMode, scheme);
              }}
              style={{ width: '100%', fontSize: 13, fontWeight: 700, padding: '10px 12px', borderRadius: 'var(--radius-md)' }}
            >
              <option value="all">All (Random Harmony) — Campuran harmoni warna acak</option>
              <option value="monochromatic">Monochromatic — Satu nada warna dengan variasi saturasi & terang</option>
              <option value="analogous">Analogous — Warna yang bersebelahan pada roda warna (harmonis)</option>
              <option value="complementary">Complementary — Warna berseberangan (kontras tinggi & dinamis)</option>
              <option value="split-complementary">Split Complementary — Variasi kontras lembut dengan warna terpisah</option>
              <option value="triadic">Triadic — Tiga warna berjarak seimbang (enerjik & seimbang)</option>
              <option value="tetradic">Tetradic — Empat warna berpasangan (paling kaya & kontras)</option>
            </select>
          </div>

          <button
            onClick={() => handleRandomize()}
            className="btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Dices size={22} />
            <span>🎲 Randomize Color Palette!</span>
          </button>

          {/* Mode Toggles */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('all'); handleRandomize('all'); }}
              style={{ fontSize: 11, padding: '5px 12px', gap: 4 }}
            >
              <Sparkles size={12} /> Bebas Acak
            </button>
            <button
              className={`btn btn-sm ${activeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('dark'); handleRandomize('dark'); }}
              style={{ fontSize: 11, padding: '5px 12px', gap: 4 }}
            >
              <Moon size={12} /> Dark Mode Only
            </button>
            <button
              className={`btn btn-sm ${activeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('light'); handleRandomize('light'); }}
              style={{ fontSize: 11, padding: '5px 12px', gap: 4 }}
            >
              <Sun size={12} /> Light Mode Only
            </button>
            <button
              className={`btn btn-sm ${activeMode === 'vibrant' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('vibrant'); handleRandomize('vibrant'); }}
              style={{ fontSize: 11, padding: '5px 12px', gap: 4 }}
            >
              <Zap size={12} /> Vibrant Neon
            </button>
          </div>
        </div>

        {/* Live Mini App UI Preview */}
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 'var(--radius-lg)', background: draftTheme.background, border: `1px solid ${draftTheme.border}`, color: draftTheme.textPrimary }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, opacity: 0.85 }}>
            ✨ Live Mini UI Preview (Pratinjau Realtime):
          </div>

          <div style={{ display: 'flex', height: 110, borderRadius: 8, overflow: 'hidden', border: `1px solid ${draftTheme.border}`, background: draftTheme.surface }}>
            {/* Mini Sidebar */}
            <div style={{ width: 50, background: draftTheme.sidebar, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: draftTheme.primary }} />
              <div style={{ width: 26, height: 4, borderRadius: 2, background: draftTheme.accent }} />
              <div style={{ width: 26, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
            </div>

            {/* Mini Main Content */}
            <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: draftTheme.background }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: draftTheme.textPrimary }}>Media Tools Dashboard</div>
                <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: draftTheme.accent, color: '#fff', fontWeight: 700 }}>Realtime Active</div>
              </div>

              <div style={{ padding: 10, borderRadius: 6, background: draftTheme.surface, border: `1px solid ${draftTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: draftTheme.textPrimary }}>Hasil Pertandingan #102</div>
                  <div style={{ fontSize: 9, color: draftTheme.textSecondary }}>Persib Bandung vs Arema FC</div>
                </div>
                <div style={{ fontSize: 10, padding: '4px 10px', borderRadius: 4, background: draftTheme.primary, color: '#ffffff', fontWeight: 700 }}>
                  Edit Skor
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fine-Tune Manual Color Pickers */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 12 }}>Pilih & Kustomisasi Warna Sesuai Selera:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
            
            {/* Primary Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
              <input type="color" value={draftTheme.primary} onChange={e => handleColorChange('primary', e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>Primary Color</div>
                <input
                  type="text"
                  value={draftTheme.primary}
                  onChange={e => handleColorChange('primary', e.target.value)}
                  style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid var(--neutral-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--neutral-900)', marginTop: 2 }}
                />
              </div>
            </div>

            {/* Accent Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
              <input type="color" value={draftTheme.accent} onChange={e => handleColorChange('accent', e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>Accent Highlight</div>
                <input
                  type="text"
                  value={draftTheme.accent}
                  onChange={e => handleColorChange('accent', e.target.value)}
                  style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid var(--neutral-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--neutral-900)', marginTop: 2 }}
                />
              </div>
            </div>

            {/* Background Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
              <input type="color" value={draftTheme.background} onChange={e => handleColorChange('background', e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>Background Page</div>
                <input
                  type="text"
                  value={draftTheme.background}
                  onChange={e => handleColorChange('background', e.target.value)}
                  style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid var(--neutral-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--neutral-900)', marginTop: 2 }}
                />
              </div>
            </div>

            {/* Card Surface Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
              <input type="color" value={draftTheme.surface} onChange={e => handleColorChange('surface', e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>Card Surface</div>
                <input
                  type="text"
                  value={draftTheme.surface}
                  onChange={e => handleColorChange('surface', e.target.value)}
                  style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid var(--neutral-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--neutral-900)', marginTop: 2 }}
                />
              </div>
            </div>

            {/* Sidebar Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
              <input type="color" value={draftTheme.sidebar} onChange={e => handleColorChange('sidebar', e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>Sidebar Nav</div>
                <input
                  type="text"
                  value={draftTheme.sidebar}
                  onChange={e => handleColorChange('sidebar', e.target.value)}
                  style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid var(--neutral-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--neutral-900)', marginTop: 2 }}
                />
              </div>
            </div>

            {/* Text Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
              <input type="color" value={draftTheme.textPrimary} onChange={e => handleColorChange('textPrimary', e.target.value)} style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>Text Main</div>
                <input
                  type="text"
                  value={draftTheme.textPrimary}
                  onChange={e => handleColorChange('textPrimary', e.target.value)}
                  style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid var(--neutral-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--neutral-900)', marginTop: 2 }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Preset Themes List */}
        <div style={{ marginBottom: 24, borderTop: '1px solid var(--neutral-200)', paddingTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 12 }}>Quick Preset Themes:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {PRESET_THEMES.map(preset => {
              const isSelected = draftTheme.name === preset.name || (draftTheme.primary === preset.primary && draftTheme.background === preset.background);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--neutral-200)',
                    background: preset.background,
                    color: preset.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                    {isSelected && <Check size={14} style={{ color: preset.primary }} />}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: preset.primary }} />
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: preset.accent }} />
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: preset.sidebar }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-200)', paddingTop: 18 }}>
          <button className="btn btn-md btn-secondary" onClick={handleResetTheme} style={{ gap: 6 }}>
            <RotateCcw size={15} /> Reset Default
          </button>

          <button className="btn btn-md btn-primary" onClick={handleSaveTheme} style={{ gap: 6 }}>
            <Check size={16} /> Simpan Skema Warna
          </button>
        </div>
      </div>

    </div>
  );
}



