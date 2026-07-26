'use client';

import React, { useState } from 'react';
import { X, Dices, RotateCcw, Palette, Check, Sparkles, Sun, Moon, Zap } from 'lucide-react';
import {
  ThemePalette,
  DEFAULT_THEME_PALETTE,
  PRESET_THEMES,
  generateRandomPalette,
  applyThemeToDocument,
  RandomMode,
} from '@/logic/colorGenerator';
import { useApp } from '@/logic/AppContext';

interface RealtimeColorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RealtimeColorStudioModal({ isOpen, onClose }: RealtimeColorStudioModalProps) {
  const { currentTheme, setCustomTheme, triggerToast } = useApp();
  const [activeMode, setActiveMode] = useState<RandomMode>('all');
  const [draftTheme, setDraftTheme] = useState<ThemePalette>(currentTheme || DEFAULT_THEME_PALETTE);

  if (!isOpen) return null;

  const handleRandomize = (modeOverride?: RandomMode) => {
    const mode = modeOverride || activeMode;
    const newPalette = generateRandomPalette(mode);
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
    <div className="modal-overlay" style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 24, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--neutral-200)', background: 'var(--white)', color: 'var(--neutral-950)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary-600), var(--accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Palette size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--neutral-950)' }}>Realtime Color Studio</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--neutral-500)' }}>Visualisasi warna acak algoritmis secara *real-time*</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Big Randomize Button */}
        <div style={{ marginBottom: 20 }}>
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
              transition: 'transform 0.15s ease, boxShadow 0.15s ease',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Dices size={22} className="spin-on-hover" />
            <span>🎲 Randomize Color Palette!</span>
          </button>

          {/* Random Mode Toggles */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('all'); handleRandomize('all'); }}
              style={{ fontSize: 11, padding: '4px 10px', gap: 4 }}
            >
              <Sparkles size={12} /> Bebas Acak
            </button>
            <button
              className={`btn btn-sm ${activeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('dark'); handleRandomize('dark'); }}
              style={{ fontSize: 11, padding: '4px 10px', gap: 4 }}
            >
              <Moon size={12} /> Dark Mode Only
            </button>
            <button
              className={`btn btn-sm ${activeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('light'); handleRandomize('light'); }}
              style={{ fontSize: 11, padding: '4px 10px', gap: 4 }}
            >
              <Sun size={12} /> Light Mode Only
            </button>
            <button
              className={`btn btn-sm ${activeMode === 'vibrant' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveMode('vibrant'); handleRandomize('vibrant'); }}
              style={{ fontSize: 11, padding: '4px 10px', gap: 4 }}
            >
              <Zap size={12} /> Vibrant Neon
            </button>
          </div>
        </div>

        {/* Live Swatch Preview */}
        <div style={{ marginBottom: 20, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--neutral-500)', letterSpacing: 0.5, marginBottom: 8 }}>
            Pratinjau Komponen Palet
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ height: 36, borderRadius: 6, backgroundColor: draftTheme.primary, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--neutral-700)' }}>Primary</span>
            </div>
            <div>
              <div style={{ height: 36, borderRadius: 6, backgroundColor: draftTheme.accent, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--neutral-700)' }}>Accent</span>
            </div>
            <div>
              <div style={{ height: 36, borderRadius: 6, backgroundColor: draftTheme.surface, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--neutral-700)' }}>Surface</span>
            </div>
            <div>
              <div style={{ height: 36, borderRadius: 6, backgroundColor: draftTheme.sidebar, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--neutral-700)' }}>Sidebar</span>
            </div>
            <div>
              <div style={{ height: 36, borderRadius: 6, backgroundColor: draftTheme.background, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--neutral-700)' }}>BG</span>
            </div>
          </div>
        </div>

        {/* Color Pickers Grid */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 10 }}>Kustomisasi Warna Fine-Tune:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={draftTheme.primary} onChange={e => handleColorChange('primary', e.target.value)} style={{ width: 34, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>Primary Color</div>
                <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>{draftTheme.primary}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={draftTheme.accent} onChange={e => handleColorChange('accent', e.target.value)} style={{ width: 34, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>Accent Highlight</div>
                <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>{draftTheme.accent}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={draftTheme.background} onChange={e => handleColorChange('background', e.target.value)} style={{ width: 34, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>Background Base</div>
                <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>{draftTheme.background}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={draftTheme.sidebar} onChange={e => handleColorChange('sidebar', e.target.value)} style={{ width: 34, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>Sidebar Nav</div>
                <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>{draftTheme.sidebar}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Preset Themes List */}
        <div style={{ marginBottom: 24, borderTop: '1px solid var(--neutral-200)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 10 }}>Quick Preset Themes:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {PRESET_THEMES.map(preset => {
              const isSelected = draftTheme.name === preset.name || (draftTheme.primary === preset.primary && draftTheme.background === preset.background);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                    {isSelected && <Check size={12} style={{ color: preset.primary }} />}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: preset.primary }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: preset.accent }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: preset.sidebar }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-200)', paddingTop: 16 }}>
          <button className="btn btn-sm btn-secondary" onClick={handleReset} style={{ gap: 6 }}>
            <RotateCcw size={14} /> Reset Default
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Tutup
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSaveTheme} style={{ gap: 6 }}>
              <Check size={14} /> Simpan Warna Ini
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
