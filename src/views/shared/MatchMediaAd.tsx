'use client';

import React from 'react';
import { ImagePlus, Megaphone, Trash2 } from 'lucide-react';
import type { MatchMediaSettings } from '@/logic/utils';
import { DEFAULT_MATCH_MEDIA_SETTINGS } from '@/logic/utils';
import type { AppSettings } from '@/logic/utils';

type ToastFn = (message: string, type?: 'success' | 'error' | 'warning') => void;

type MatchMediaControlsProps = {
  settings: MatchMediaSettings;
  onChange: (settings: MatchMediaSettings) => void;
  triggerToast?: ToastFn;
  defaultPlacement?: MatchMediaSettings['placement'];
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

        <div className="match-media-static-field">Halaman iklan</div>

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

type MatchMediaPageCardProps = {
  settings?: MatchMediaSettings;
  elementId?: string;
  width?: number;
  height?: number;
  appSettings: AppSettings;
  competitionName?: string;
  competitionLogo?: string;
  matchTitle?: string;
  backgroundImage?: string | null;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  backgroundZoom?: number;
  backgroundDim?: number;
};

export function hasMatchMediaPage(settings?: MatchMediaSettings) {
  const value = normalizeSettings(settings);
  const label = (value.label || '').trim();
  return Boolean(value.enabled && (value.image || label));
}

export function MatchMediaPageCard({
  settings,
  elementId,
  width = 400,
  height = 500,
  appSettings,
  competitionName,
  competitionLogo,
  matchTitle,
  backgroundImage,
  backgroundPositionX = 50,
  backgroundPositionY = 50,
  backgroundZoom = 100,
  backgroundDim = 20,
}: MatchMediaPageCardProps) {
  const value = normalizeSettings(settings);
  const label = (value.label || 'MEDIA PARTNER').trim();
  if (!hasMatchMediaPage(value)) return null;

  const mediaBoxHeight = Math.max(190, Math.round(height * 0.48));

  return (
    <div id={elementId} style={{
      width,
      height,
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 16,
      boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {backgroundImage ? (
        <>
          <img
            src={backgroundImage}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
              transform: `scale(${backgroundZoom / 100})`,
              transformOrigin: `${backgroundPositionX}% ${backgroundPositionY}%`,
              zIndex: 0,
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(rgba(10, 10, 10, ${Math.max(backgroundDim + 12, 35) / 100}) 0%, rgba(10, 10, 10, ${Math.min(backgroundDim + 35, 75) / 100}) 100%)`,
            zIndex: 1,
            pointerEvents: 'none',
          }} />
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
        </>
      )}

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', zIndex: 3 }} />

      <div style={{
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 0',
        marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {competitionLogo && competitionLogo.startsWith('http')
            ? <img src={competitionLogo} crossOrigin="anonymous" alt="" style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
            : <div style={{ width: 18, height: 18, background: 'rgba(10, 10, 10, 0.65)', borderRadius: 3, border: '1px solid rgba(200,168,75,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.35)' }}>
                <div style={{ width: 6, height: 6, background: '#c8a84b', borderRadius: 1 }} />
              </div>}
          <span style={{
            fontSize: 8,
            fontWeight: 800,
            backgroundColor: '#c8a84b',
            color: '#0a0a0a',
            padding: '2px 6px',
            borderRadius: 3,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            maxWidth: 150,
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}>
            {competitionName || 'LIGA NUSANTARA UTAMA'}
          </span>
        </div>
        {appSettings.appLogoSrc && (
          <img src={appSettings.appLogoSrc} alt={appSettings.appName} style={{ height: 24, maxWidth: 78, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
        )}
      </div>

      <div style={{
        zIndex: 2,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 14,
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 900,
          color: '#c8a84b',
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          textShadow: '0 1px 2px rgba(0,0,0,0.85)',
        }}>
          {label}
        </div>

        <div style={{
          height: mediaBoxHeight,
          border: '1px solid rgba(200,168,75,0.32)',
          borderRadius: 6,
          background: value.fit === 'cover' ? 'rgba(10, 10, 10, 0.35)' : 'rgba(255,255,255,0.94)',
          boxShadow: '0 18px 34px rgba(0,0,0,0.42)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: value.fit === 'cover' ? 0 : 18,
        }}>
          {value.image ? (
            <img
              src={value.image}
              crossOrigin="anonymous"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: value.fit || 'contain',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ color: '#0a0a0a', fontSize: 18, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center' }}>
              {label}
            </span>
          )}
        </div>

        <div style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#e2e8f0',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          lineHeight: 1.35,
          textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.7)',
        }}>
          {matchTitle || 'Media Partner'}
        </div>
      </div>

      <div style={{
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        paddingTop: 6,
        fontSize: 8,
        color: '#a0aec0',
        fontWeight: 600,
        textShadow: '0 1px 2px rgba(0,0,0,0.9)',
      }}>
        <span>{appSettings.appHandle}</span>
        <span>ADVERTISEMENT</span>
      </div>
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
