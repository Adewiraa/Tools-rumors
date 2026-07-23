'use client';

import React from 'react';
import { ImagePlus, Megaphone, Trash2 } from 'lucide-react';
import type { AppSettings, MatchMediaAdItem, MatchMediaSettings } from '@/logic/utils';
import { DEFAULT_MATCH_MEDIA_SETTINGS, getMatchMediaAds, hasMatchMediaAds } from '@/logic/utils';

type ToastFn = (message: string, type?: 'success' | 'error' | 'warning') => void;

type MatchMediaControlsProps = {
  settings: MatchMediaSettings;
  onChange: (settings: MatchMediaSettings) => void;
  triggerToast?: ToastFn;
};

const normalizeSettings = (settings?: MatchMediaSettings) => ({
  ...DEFAULT_MATCH_MEDIA_SETTINGS,
  ...settings,
  ads: getMatchMediaAds(settings),
});

const createAdId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `ad-${Date.now()}-${Math.round(Math.random() * 1000)}`
);

export function MatchMediaControls({
  settings,
  onChange,
  triggerToast,
}: MatchMediaControlsProps) {
  const value = normalizeSettings(settings);

  const updateAds = (ads: MatchMediaAdItem[], enabled = value.enabled) => {
    const firstAd = ads[0];
    onChange({
      ...value,
      enabled,
      ads,
      image: firstAd?.image || null,
      label: firstAd?.label || '',
      fit: firstAd?.fit || value.fit || 'contain',
      placement: 'footer',
    });
  };

  const updateAd = (id: string, next: Partial<MatchMediaAdItem>) => {
    updateAds(value.ads.map(ad => ad.id === id ? { ...ad, ...next } : ad));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    Promise.all(files.map(file => new Promise<MatchMediaAdItem>((resolve) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const image = loadEvent.target?.result;
        resolve({
          id: createAdId(),
          image: typeof image === 'string' ? image : null,
          label: '',
          fit: value.fit || 'contain',
        });
      };
      reader.readAsDataURL(file);
    }))).then(newAds => {
      updateAds([...value.ads, ...newAds], true);
      triggerToast?.(`${newAds.length} media iklan siap digunakan.`);
    });

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
            onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          />
          <span>Tampilkan</span>
        </label>
      </div>

      <div className="match-media-control-grid">
        <label className="match-media-upload">
          <input type="file" accept="image/*" multiple onChange={handleFileChange} />
          <span className="match-media-upload-icon">
            <ImagePlus size={16} />
          </span>
          <span>Tambah Media</span>
        </label>

        <div className="match-media-static-field">Halaman iklan</div>
        <div className="match-media-static-field">{value.ads.length} slide</div>

        <select
          className="form-select"
          value={value.fit || 'contain'}
          onChange={(event) => {
            const fit = event.target.value as MatchMediaAdItem['fit'];
            updateAds(value.ads.map(ad => ({ ...ad, fit })));
          }}
        >
          <option value="contain">Logo utuh</option>
          <option value="cover">Isi area</option>
        </select>
      </div>

      {value.ads.length > 0 ? (
        <div className="match-media-list">
          {value.ads.map((ad, index) => (
            <div className="match-media-ad-item" key={ad.id || index}>
              <div className="match-media-preview-box">
                {ad.image ? <img src={ad.image} alt="" /> : <span>{index + 1}</span>}
              </div>
              <div className="match-media-ad-fields">
                <input
                  className="form-input match-media-label-input"
                  value={ad.label || ''}
                  onChange={(event) => updateAd(ad.id || `ad-${index + 1}`, { label: event.target.value })}
                  placeholder={`Label iklan ${index + 1}, contoh: Didukung oleh...`}
                />
                <select
                  className="form-select"
                  value={ad.fit || 'contain'}
                  onChange={(event) => updateAd(ad.id || `ad-${index + 1}`, { fit: event.target.value as MatchMediaAdItem['fit'] })}
                >
                  <option value="contain">Logo utuh</option>
                  <option value="cover">Isi area</option>
                </select>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary match-media-remove-btn"
                onClick={() => updateAds(value.ads.filter(item => item.id !== ad.id))}
              >
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="match-media-empty">Belum ada slide iklan.</div>
      )}
    </div>
  );
}

type MatchMediaPageCardProps = {
  settings?: MatchMediaSettings;
  ad?: MatchMediaAdItem;
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
  slideIndex?: number;
  slideTotal?: number;
};

export function hasMatchMediaPage(settings?: MatchMediaSettings) {
  return hasMatchMediaAds(settings);
}

export function getMatchMediaPages(settings?: MatchMediaSettings) {
  return hasMatchMediaAds(settings) ? getMatchMediaAds(settings) : [];
}

export function MatchMediaPageCard({
  settings,
  ad,
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
  slideIndex = 1,
  slideTotal = 1,
}: MatchMediaPageCardProps) {
  const selectedAd = ad || getMatchMediaPages(settings)[0];
  if (!selectedAd) return null;

  const label = (selectedAd.label || 'MEDIA PARTNER').trim();
  const mediaBoxHeight = Math.max(190, Math.round(height * 0.48));
  const fit = selectedAd.fit || settings?.fit || 'contain';

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
          background: fit === 'cover' ? 'rgba(10, 10, 10, 0.35)' : 'rgba(255,255,255,0.94)',
          boxShadow: '0 18px 34px rgba(0,0,0,0.42)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: fit === 'cover' ? 0 : 18,
        }}>
          {selectedAd.image ? (
            <img
              src={selectedAd.image}
              crossOrigin="anonymous"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: fit,
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
        <span>{slideTotal > 1 ? `ADVERTISEMENT ${slideIndex}/${slideTotal}` : 'ADVERTISEMENT'}</span>
      </div>
    </div>
  );
}
