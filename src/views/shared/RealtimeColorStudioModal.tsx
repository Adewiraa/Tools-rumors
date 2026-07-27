'use client';

import React, { useState } from 'react';
import { X, RotateCcw, Palette, Check, Copy, Layers, Sliders } from 'lucide-react';
import {
  ThemePalette,
  DEFAULT_THEME_PALETTE,
  PRESET_THEMES,
  applyThemeToDocument,
  exportCSSVariables,
  getContrastRatio,
  getWCAGRating,
  generateShades,
} from '@/logic/colorGenerator';
import { useApp } from '@/logic/AppContext';

interface RealtimeColorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RealtimeColorStudioModal({ isOpen, onClose }: RealtimeColorStudioModalProps) {
  const { currentTheme, setCustomTheme, triggerToast, logAction } = useApp();
  const [draftTheme, setDraftTheme] = useState<ThemePalette>(currentTheme || DEFAULT_THEME_PALETTE);
  const [activeTab, setActiveTab] = useState<'presets' | 'pickers'>('presets');

  if (!isOpen) return null;

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
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(102, 117, 106, 0.35)' }}>
              <Palette size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--neutral-950)' }}>Studio Tema & Warna Media</h3>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: draftTheme.isDark ? '#1e293b' : '#e2e8f0', color: draftTheme.isDark ? '#cbd5e1' : '#334155' }}>
                  {draftTheme.isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>Pilihan Tema Media Sepakbola Terkurasi & Kustomisasi Warna Kalem</p>
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
            className={`btn btn-sm ${activeTab === 'presets' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('presets')}
            style={{ fontSize: 12, gap: 6 }}
          >
            <Layers size={14} /> Preset Tema Terkurasi ({PRESET_THEMES.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'pickers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pickers')}
            style={{ fontSize: 12, gap: 6 }}
          >
            <Sliders size={14} /> Kustomisasi Warna Manual
          </button>
        </div>

        {/* Tab 1: Curated Presets Grid */}
        {activeTab === 'presets' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 12 }}>Pilihan Tema Media Sepakbola Terkurasi (Modern & Kalem):</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
              {PRESET_THEMES.map(preset => {
                const isSelected = draftTheme.name === preset.name || (draftTheme.primary === preset.primary && draftTheme.background === preset.background);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--neutral-200)',
                      background: preset.background,
                      color: preset.textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      boxShadow: isSelected ? '0 4px 12px rgba(102,117,106,0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                      {isSelected && <Check size={16} style={{ color: preset.primary }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: preset.primary, border: '1px solid rgba(0,0,0,0.1)' }} title="Primary Color" />
                      <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: preset.accent, border: '1px solid rgba(0,0,0,0.1)' }} title="Accent Color" />
                      <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: preset.sidebar, border: '1px solid rgba(0,0,0,0.1)' }} title="Sidebar Nav" />
                      <span style={{ fontSize: 10, color: preset.textSecondary, marginLeft: 4 }}>{preset.isDark ? 'Dark Theme' : 'Light Theme'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Manual Fine-Tune Color Pickers */}
        {activeTab === 'pickers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)' }}>Atur Warna 6 Elemen Utama UI Secara Presisi:</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              
              {[
                { key: 'primary', label: 'Primary Brand' },
                { key: 'accent', label: 'Accent Highlight' },
                { key: 'background', label: 'Background Page' },
                { key: 'surface', label: 'Card Surface' },
                { key: 'sidebar', label: 'Sidebar Nav' },
                { key: 'textPrimary', label: 'Text Main' },
              ].map(item => {
                const val = (draftTheme as any)[item.key] || '#000000';
                return (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                    <input
                      type="color"
                      value={val}
                      onChange={e => handleColorChange(item.key as keyof ThemePalette, e.target.value)}
                      style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-900)' }}>{item.label}</span>
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
                🎨 Skala Shade & Tint Otomatis Primary ({draftTheme.primary}):
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

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-200)', paddingTop: 18, marginTop: 20 }}>
          <button className="btn btn-sm btn-secondary" onClick={handleReset} style={{ gap: 6 }}>
            <RotateCcw size={14} /> Reset Default (Quiet Stadium Sage)
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
