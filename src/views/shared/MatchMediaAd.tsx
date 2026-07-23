'use client';

import React from 'react';
import { ImagePlus, Megaphone, Trash2 } from 'lucide-react';
import type { MatchMediaSettings } from '@/logic/utils';
import { DEFAULT_MATCH_MEDIA_SETTINGS } from '@/logic/utils';

type ToastFn = (message: string, type?: 'success' | 'error' | 'warning') => void;

type MatchMediaControlsProps = {
  settings: MatchMediaSettings;
  onChange: (settings: MatchMediaSettings) => void;
  triggerToast?: ToastFn;
  defaultPlacement?: MatchMediaSettings['placement'];
  showPlacementSelect?: boolean;
};

const normalizeSettings = (settings?: MatchMediaSettings, defaultPlacement: MatchMediaSettings['placement'] = 'footer') => ({
  ...DEFAULT_MATCH_MEDIA_SETTINGS,
  placement: defaultPlacement,
  ...settings,
});

export function MatchMediaControls({
  settings,
  onChange,
  triggerToast,
  defaultPlacement = 'footer',
  showPlacementSelect = true,
}: MatchMediaControlsProps) {
  const value = normalizeSettings(settings, defaultPlacement);

  const update = (next: Partial<MatchMediaSettings>) => {
    onChange({ ...value, ...next });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const image = loadEvent.target?.result;
      if (typeof image !== 'string') return;
      onChange({
        ...value,
        enabled: true,
        image,
        placement: value.placement || defaultPlacement,
      });
      triggerToast?.('Media iklan siap digunakan.');
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = '';
  };

  return (
    <div className="match-media-controls">
      <div className="match-media-controls-head">
        <div className="match-media-controls-title">
          <Megaphone size={15} />
          <span>Media Iklan</span>
        </div>
        <label className="match-media-toggle">
          <input
            type="checkbox"
            checked={Boolean(value.enabled)}
            onChange={(event) => update({ enabled: event.target.checked })}
          />
          <span>Tampilkan</span>
        </label>
      </div>

      <div className="match-media-control-grid">
        <label className="match-media-upload">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <span className="match-media-upload-icon">
            <ImagePlus size={16} />
          </span>
          <span>{value.image ? 'Ganti Media' : 'Upload Media'}</span>
        </label>

        <input
          className="form-input match-media-label-input"
          value={value.label || ''}
          onChange={(event) => update({ label: event.target.value })}
          placeholder="Label sponsor, contoh: Didukung oleh..."
        />

        {showPlacementSelect ? (
          <select
            className="form-select"
            value={value.placement || defaultPlacement}
            onChange={(event) => update({ placement: event.target.value as MatchMediaSettings['placement'] })}
          >
            <option value="footer">Footer</option>
            <option value="header-right">Kanan header</option>
          </select>
        ) : (
          <div className="match-media-static-field">Footer story</div>
        )}

        <select
          className="form-select"
          value={value.fit || 'contain'}
          onChange={(event) => update({ fit: event.target.value as MatchMediaSettings['fit'] })}
        >
          <option value="contain">Logo utuh</option>
          <option value="cover">Isi area</option>
        </select>
      </div>

      {value.image && (
        <div className="match-media-preview-row">
          <div className="match-media-preview-box">
            <img src={value.image} alt="" />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => update({ image: null })}
          >
            <Trash2 size={13} /> Hapus Media
          </button>
        </div>
      )}
    </div>
  );
}

type MatchMediaBadgeProps = {
  settings?: MatchMediaSettings;
  placement: NonNullable<MatchMediaSettings['placement']>;
  variant?: 'lineup' | 'result';
};

export function MatchMediaBadge({ settings, placement, variant = 'result' }: MatchMediaBadgeProps) {
  const value = normalizeSettings(settings);
  const label = (value.label || '').trim();
  const showContent = value.enabled && (Boolean(value.image) || Boolean(label));
  if (!showContent || value.placement !== placement) return null;

  const isHeaderBadge = placement === 'header-right';
  const isLineup = variant === 'lineup';
  const imageStyle: React.CSSProperties = {
    maxWidth: isHeaderBadge ? 70 : isLineup ? 86 : 104,
    maxHeight: isHeaderBadge ? 24 : 28,
    width: isHeaderBadge ? undefined : 'auto',
    height: isHeaderBadge ? 24 : 28,
    objectFit: value.fit || 'contain',
    borderRadius: 3,
    display: value.image ? 'block' : 'none',
  };

  const baseStyle: React.CSSProperties = isHeaderBadge
    ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
        maxWidth: 142,
        minHeight: 30,
        padding: '3px 6px',
        borderRadius: 4,
        background: 'rgba(10, 10, 10, 0.62)',
        border: '1px solid rgba(200,168,75,0.24)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
      }
    : {
        zIndex: 2,
        marginTop: isLineup ? 0 : 6,
        padding: isLineup ? '6px 16px 7px' : '6px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
      };

  return (
    <div style={baseStyle}>
      {label && (
        <span style={{
          fontSize: isHeaderBadge ? 5.5 : 6.5,
          fontWeight: 800,
          color: '#c8a84b',
          letterSpacing: isHeaderBadge ? 0.8 : 1.2,
          textTransform: 'uppercase',
          lineHeight: 1.1,
          maxWidth: isHeaderBadge ? 54 : 130,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}>
          {label}
        </span>
      )}
      {value.image && <img src={value.image} crossOrigin="anonymous" alt="" style={imageStyle} />}
    </div>
  );
}
