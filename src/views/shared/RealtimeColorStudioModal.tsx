'use client';

import React, { useState } from 'react';
import { X, Dices, RotateCcw, Palette, Check, Sparkles, Sun, Moon, Zap, Copy, Layers, Sliders, Lock, Unlock } from 'lucide-react';
import {
  ThemePalette,
  DEFAULT_THEME_PALETTE,
  PRESET_THEMES,
  generateRandomPalette,
  applyThemeToDocument,
  exportCSSVariables,
  getContrastRatio,
  getWCAGRating,
  generateShades,
  RandomMode,
  ColorSchemeType,
} from '@/logic/colorGenerator';
import { useApp } from '@/logic/AppContext';

interface RealtimeColorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEME_OPTIONS: { id: ColorSchemeType; label: string; desc: string }[] = [
  { id: 'all', label: 'All (Random Harmony)', desc: 'Campuran harmoni warna acak' },
  { id: 'monochromatic', label: 'Monochromatic', desc: 'Satu nada warna dengan variasi saturasi & terang' },
  { id: 'analogous', label: 'Analogous', desc: 'Warna yang bersebelahan pada roda warna (harmonis)' },
  { id: 'complementary', label: 'Complementary', desc: 'Warna berseberangan (kontras tinggi & dinamis)' },
  { id: 'split-complementary', label: 'Split Complementary', desc: 'Variasi kontras lembut dengan warna terpisah' },
  { id: 'triadic', label: 'Triadic', desc: ' Tiga warna berjarak seimbang (enerjik & seimbang)' },
  { id: 'tetradic', label: 'Tetradic', desc: 'Empat warna berpasangan (paling kaya & kontras)' },
];

export default function RealtimeColorStudioModal({ isOpen, onClose }: RealtimeColorStudioModalProps) {
  const { currentTheme, setCustomTheme, triggerToast, logAction } = useApp();
  const [activeMode, setActiveMode] = useState<RandomMode>('all');
  const [activeScheme, setActiveScheme] = useState<ColorSchemeType>('all');
  const [draftTheme, setDraftTheme] = useState<ThemePalette>(currentTheme || DEFAULT_THEME_PALETTE);
  const [activeTab, setActiveTab] = useState<'randomizer' | 'pickers' | 'presets'>('randomizer');
  const [lockedColors, setLockedColors] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleLock = (field: string) => {
    setLockedColors(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleRandomize = (modeOverride?: RandomMode, schemeOverride?: ColorSchemeType) => {
    const mode = modeOverride || activeMode;
    const scheme = schemeOverride || activeScheme;
    const newPalette = generateRandomPalette(mode, scheme, lockedColors, draftTheme);
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
    logAction('UPDATE_THEME', 'Pengaturan', `Memperbarui skema warna tema`);
    triggerToast('Skema warna berhasil disimpan!', 'success');
    onClose();
  };

  const handleReset = () => {
    setDraftTheme(DEFAULT_THEME_PALETTE);
    setCustomTheme(DEFAULT_THEME_PALETTE);
    applyThemeToDocument(DEFAULT_THEME_PALETTE);
    triggerToast('Warna dikembalikan ke default!', 'success');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5, 8, 15, 0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', padding: 24, borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid var(--neutral-200)', background: 'var(--white)', color: 'var(--neutral-950)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)' }}>
              <Palette size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--neutral-950)' }}>Realtime Color Studio</h3>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: draftTheme.isDark ? '#312e81' : '#e0e7ff', color: draftTheme.isDark ? '#c7d2fe' : '#4338ca' }}>
                  {draftTheme.isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>Algoritma Penjelajah Warna Acak & Harmoni Teori Warna Realtime</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Live Mini App UI Preview */}
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, background: draftTheme.background, border: `1px solid ${draftTheme.border}`, color: draftTheme.textPrimary, transition: 'background-color 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 }}>
              ✨ Pratinjau Tampilan Realtime:
            </div>
            <button
              className="btn btn-sm btn-secondary"
              style={{ fontSize: 10, padding: '2px 8px', height: 24, gap: 4 }}
              onClick={() => {
                const code = exportCSSVariables(draftTheme);
                navigator.clipboard.writeText(code);
                triggerToast('Kode CSS berhasil disalin!', 'success');
              }}
              title="Salin Kode Warna CSS Variable"
            >
              <Copy size={11} /> Copy CSS Code
            </button>
          </div>

          {/* Mini App Frame */}
          <div style={{ display: 'flex', height: 105, borderRadius: 8, overflow: 'hidden', border: `1px solid ${draftTheme.border}`, background: draftTheme.surface }}>
            {/* Mini Sidebar */}
            <div style={{ width: 50, background: draftTheme.sidebar, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: draftTheme.primary }} />
              <div style={{ width: 26, height: 4, borderRadius: 2, background: draftTheme.accent }} />
              <div style={{ width: 26, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
            </div>

            {/* Mini Main Content */}
            <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: draftTheme.background }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: draftTheme.textPrimary }}>Media Tools Portal</div>
                <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: draftTheme.accent, color: '#fff', fontWeight: 700 }}>Active</div>
              </div>

              <div style={{ padding: 8, borderRadius: 6, background: draftTheme.surface, border: `1px solid ${draftTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: draftTheme.textPrimary }}>Hasil Pertandingan #102</div>
                  <div style={{ fontSize: 8, color: draftTheme.textSecondary }}>Persib Bandung vs Arema FC</div>
                </div>
                <div style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: draftTheme.primary, color: '#ffffff', fontWeight: 700 }}>
                  Edit Skor
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--neutral-200)', paddingBottom: 12, marginBottom: 20 }}>
          <button
            className={`btn btn-sm ${activeTab === 'randomizer' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('randomizer')}
            style={{ fontSize: 12, gap: 6 }}
          >
            <Dices size={14} /> Generator Acak & Harmoni
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'pickers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pickers')}
            style={{ fontSize: 12, gap: 6 }}
          >
            <Sliders size={14} /> Kustomisasi Warna Manual
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'presets' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('presets')}
            style={{ fontSize: 12, gap: 6 }}
          >
            <Layers size={14} /> Presets ({PRESET_THEMES.length})
          </button>
        </div>

        {/* Tab 1: Randomizer & Color Harmonies */}
        {activeTab === 'randomizer' && (
          <div>
            {/* Color Scheme Harmonies Dropdown Selector */}
            <div style={{ marginBottom: 18 }}>
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
                {SCHEME_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} — {opt.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Toggles */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                Modu Acak:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <button
                  className={`btn btn-sm ${activeMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('all'); handleRandomize('all'); }}
                  style={{ fontSize: 11, justifyContent: 'center', gap: 4 }}
                >
                  <Sparkles size={12} /> Bebas Acak
                </button>
                <button
                  className={`btn btn-sm ${activeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('dark'); handleRandomize('dark'); }}
                  style={{ fontSize: 11, justifyContent: 'center', gap: 4 }}
                >
                  <Moon size={12} /> Dark Mode
                </button>
                <button
                  className={`btn btn-sm ${activeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('light'); handleRandomize('light'); }}
                  style={{ fontSize: 11, justifyContent: 'center', gap: 4 }}
                >
                  <Sun size={12} /> Light Mode
                </button>
                <button
                  className={`btn btn-sm ${activeMode === 'vibrant' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActiveMode('vibrant'); handleRandomize('vibrant'); }}
                  style={{ fontSize: 11, justifyContent: 'center', gap: 4 }}
                >
                  <Zap size={12} /> Vibrant
                </button>
              </div>
            </div>

            {/* Giant Randomize Action Button */}
            <button
              onClick={() => handleRandomize()}
              className="btn"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: 16,
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
                boxShadow: '0 6px 20px rgba(168, 85, 247, 0.4)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Dices size={24} />
              <span>🎲 Randomize Color Palette!</span>
            </button>
          </div>
        )}

        {/* Tab 2: Manual Fine-Tune Color Pickers */}
        {activeTab === 'pickers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)' }}>Pilih & Kustomisasi 6 Elemen Utama UI (Kunci dengan Pin agar tidak teracak):</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              
              {[
                { key: 'primary', label: 'Primary Brand' },
                { key: 'accent', label: 'Accent Highlight' },
                { key: 'background', label: 'Background Page' },
                { key: 'surface', label: 'Card Surface' },
                { key: 'sidebar', label: 'Sidebar Nav' },
                { key: 'textPrimary', label: 'Text Main' },
              ].map(item => {
                const isLocked = Boolean(lockedColors[item.key]);
                const val = (draftTheme as any)[item.key] || '#000000';
                return (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: isLocked ? 'rgba(99, 102, 241, 0.06)' : 'var(--neutral-50)', border: isLocked ? '1px solid #818cf8' : '1px solid var(--neutral-200)', transition: 'all 0.15s ease' }}>
                    <input
                      type="color"
                      value={val}
                      onChange={e => handleColorChange(item.key as keyof ThemePalette, e.target.value)}
                      style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>{item.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleLock(item.key)}
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2, color: isLocked ? '#4f46e5' : 'var(--neutral-400)' }}
                          title={isLocked ? 'Warna dikunci saat acak' : 'Kunci warna ini agar tidak teracak'}
                        >
                          {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={e => handleColorChange(item.key as keyof ThemePalette, e.target.value)}
                        style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '3px 6px', border: '1px solid var(--neutral-300)', borderRadius: 4, background: 'var(--white)', color: 'var(--neutral-900)', marginTop: 2 }}
                      />
                    </div>
                  </div>
                );
              })}

            </div>

            {/* WCAG Accessibility Contrast Checker */}
            {(() => {
              const ratio = getContrastRatio(draftTheme.textPrimary, draftTheme.background);
              const rating = getWCAGRating(ratio);
              return (
                <div style={{ padding: 12, borderRadius: 8, background: rating.pass ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: rating.pass ? '1px solid #a7f3d0' : '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neutral-900)' }}>♿ WCAG 2.1 Contrast Checker</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-600)', marginTop: 1 }}>Keterbacaan Teks Utama vs Latar Belakang Page ({draftTheme.textPrimary} / {draftTheme.background})</div>
                  </div>
                  <span className={`badge ${rating.pass ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 11, fontWeight: 800 }}>
                    {ratio}:1 — {rating.text}
                  </span>
                </div>
              );
            })()}

            {/* 10-Step Shade & Tint Scale Generator */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neutral-800)', marginBottom: 6 }}>
                🎨 Skala Shade & Tint Automatis Primary ({draftTheme.primary}):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 3, padding: 6, background: 'var(--neutral-50)', borderRadius: 8, border: '1px solid var(--neutral-200)' }}>
                {generateShades(draftTheme.primary).map(sh => (
                  <div
                    key={sh.step}
                    title={`Shade ${sh.step}: ${sh.hex}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  >
                    <div style={{ width: '100%', height: 26, borderRadius: 4, backgroundColor: sh.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--neutral-600)' }}>{sh.step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Curated Presets Grid */}
        {activeTab === 'presets' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 12 }}>Pilihan 15+ Tema Terkurasi Pilihan:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
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
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-200)', paddingTop: 18, marginTop: 20 }}>
          <button className="btn btn-sm btn-secondary" onClick={handleReset} style={{ gap: 6 }}>
            <RotateCcw size={14} /> Reset Default
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSaveTheme} style={{ gap: 6 }}>
              <Check size={14} /> Simpan Skema Warna
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
