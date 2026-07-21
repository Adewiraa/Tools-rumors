'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Match, Competition } from '@/lib/mockData';
import { ChevronRight, Info, Share2, Download, X } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import {
  getEffectiveLineupStatus,
  getEffectiveMatchStatus,
  hasResultProgress,
  hasSavedHalfTimeResult,
  hasHalfTimeScoreValues,
  getResultGraphicSettings,
  getMatchTimelineEvents
} from '@/logic/utils';
import type { AppSettings } from '@/logic/utils';

export default function ResultsListView() {
  const router = useRouter();
  const {
    appSettings,
    matches,
    competitions,
    hasPermission,
    triggerToast
  } = useApp();

  const [selectedComp, setSelectedComp] = useState('Semua');
  const [timelineMatch, setTimelineMatch] = useState<Match | null>(null);
  const [isExportingResultOutput, setIsExportingResultOutput] = useState(false);

  const filteredMatches = matches
    .filter(match => getEffectiveLineupStatus(match) === 'Complete' || getEffectiveMatchStatus(match) === 'Finished' || hasResultProgress(match))
    .filter(match => selectedComp === 'Semua' || match.competition === selectedComp)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  const statusLabel = (s: string) => ({
    Scheduled: 'Dijadwalkan',
    Live: 'Live',
    Finished: 'Selesai',
    Postponed: 'Ditunda',
    Cancelled: 'Dibatalkan'
  }[s] || s);

  const lineupStatusLabel = (match: Match) => {
    if (getEffectiveMatchStatus(match) === 'Finished') return 'Selesai';
    const effectiveLineupStatus = getEffectiveLineupStatus(match);
    return effectiveLineupStatus === 'Complete' ? 'Siap' : effectiveLineupStatus === 'Needs Review' ? 'Review' : 'Belum';
  };

  const lineupStatusClass = (match: Match) => {
    if (getEffectiveMatchStatus(match) === 'Finished') return 'badge-success';
    const effectiveLineupStatus = getEffectiveLineupStatus(match);
    return effectiveLineupStatus === 'Complete' ? 'badge-success' : effectiveLineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft';
  };

  const getResultOutputElementId = (matchId: string, type: 'HT' | 'FT') => `result-output-card-${matchId}-${type.toLowerCase()}`;
  const getResultOutputFileName = (match: Match, type: 'HT' | 'FT') => `Result_${type}_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`.replace(/[^\w.-]+/g, '_');

  const createResultOutputImage = async (match: Match, type: 'HT' | 'FT') => {
    const node = document.getElementById(getResultOutputElementId(match.id, type));
    if (!node) throw new Error('Gambar hasil belum siap.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob, fileName: getResultOutputFileName(match, type) };
  };

  const downloadResultOutput = async (match: Match, type: 'HT' | 'FT') => {
    try {
      setIsExportingResultOutput(true);
      triggerToast(`Membuat gambar ${type}...`);
      const { dataUrl, fileName } = await createResultOutputImage(match, type);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast(`Gambar ${type} berhasil diunduh!`);
    } catch (err) {
      console.warn('Result output download failed:', err);
      triggerToast(`Gagal mengunduh gambar ${type}.`, 'error');
    } finally {
      setIsExportingResultOutput(false);
    }
  };

  const shareResultOutput = async (match: Match, type: 'HT' | 'FT') => {
    try {
      setIsExportingResultOutput(true);
      triggerToast(`Membuat gambar ${type}...`);
      const { blob, dataUrl, fileName } = await createResultOutputImage(match, type);
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: `${type} ${match.homeClubName} vs ${match.awayClubName}`,
        text: `Hasil ${type} ${match.homeClubName} vs ${match.awayClubName}`,
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast(`Gambar ${type} siap dibagikan.`);
        return;
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.warn('Result output share failed:', err);
        triggerToast(`Gagal membagikan gambar ${type}.`, 'error');
      }
    } finally {
      setIsExportingResultOutput(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/results?edit=${id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Hasil Pertandingan</span>
          </div>
          <h1 className="page-title">Hasil Pertandingan</h1>
          <p className="page-description">Kelola skor akhir, timeline pencetak gol, status adu penalti, dan status review pertandingan.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <select className="form-select" style={{ maxWidth: 240 }} value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
          <option value="Semua">Semua Kompetisi</option>
          {competitions.map(comp => (
            <option key={comp.id} value={comp.name}>{comp.name}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pertandingan</th>
              <th>Kompetisi</th>
              <th>HT</th>
              <th>FT</th>
              <th>Status</th>
              <th>Lineup</th>
              <th>Publikasi</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map(match => {
              const effectiveStatus = getEffectiveMatchStatus(match);
              const hasSavedHalfTime = hasSavedHalfTimeResult(match);
              const canInputResult = (effectiveStatus === 'Live' || hasSavedHalfTime) && (getEffectiveLineupStatus(match) === 'Complete' || hasSavedHalfTime);
              return (
                <tr key={match.id}>
                  <td>
                    <div className="flex align-center gap-12">
                      {match.homeLogo && match.homeLogo.startsWith('http')
                        ? <img src={match.homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 20 }}>{match.homeLogo}</span>}
                      <span className="semibold">{match.homeClubName} vs {match.awayClubName}</span>
                      {match.awayLogo && match.awayLogo.startsWith('http')
                        ? <img src={match.awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 20 }}>{match.awayLogo}</span>}
                    </div>
                    <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>ID Jadwal: {match.id}</div>
                  </td>
                  <td>{match.competition}</td>
                  <td>
                    {hasSavedHalfTime && hasHalfTimeScoreValues(match) ? (
                      <span className="semibold">{match.halfTimeHomeScore} - {match.halfTimeAwayScore}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null ? (
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{match.homeScore} - {match.awayScore}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${effectiveStatus === 'Finished' ? 'badge-success' : effectiveStatus === 'Live' ? 'badge-danger' : 'badge-warning'}`}>
                      {statusLabel(effectiveStatus)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${lineupStatusClass(match)}`}>
                      {lineupStatusLabel(match)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                      {match.publicationStatus}
                    </span>
                  </td>
                  <td className="text-right">
                    {effectiveStatus === 'Finished' ? (
                      <button className="btn btn-sm btn-secondary" onClick={() => setTimelineMatch(match)}>
                        <Info size={13} /> Lihat Timeline
                      </button>
                    ) : hasPermission('Match Result', 'create_edit') && (
                      <button className="btn btn-sm btn-secondary" disabled={!canInputResult} title={canInputResult ? 'Input hasil HT/FT' : 'Input hasil tersedia saat pertandingan Live dan lineup lengkap'} onClick={() => handleEdit(match.id)}>
                        Input HT/FT
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {timelineMatch && (
        <div className="modal-overlay">
          <div className="modal-content output-preview-modal">
            <div className="output-preview-header">
              <div>
                <h3 className="output-preview-title">Gambar Hasil Pertandingan</h3>
                <div className="output-preview-meta">{timelineMatch.homeClubName} vs {timelineMatch.awayClubName} - ID Jadwal: {timelineMatch.id}</div>
              </div>
              <button className="btn btn-sm btn-secondary output-preview-close" title="Tutup" onClick={() => setTimelineMatch(null)}><X size={16} /></button>
            </div>
            <div className="output-preview-stage">
              <div className="output-preview-gallery">
                {hasSavedHalfTimeResult(timelineMatch) &&
                  timelineMatch.halfTimeHomeScore !== undefined && timelineMatch.halfTimeHomeScore !== null &&
                  timelineMatch.halfTimeAwayScore !== undefined && timelineMatch.halfTimeAwayScore !== null && (
                    <div className="output-preview-item">
                      <div className="output-preview-item-label">Half Time</div>
                      <ResultOutputGraphicCard
                        match={timelineMatch}
                        competitions={competitions}
                        elementId={getResultOutputElementId(timelineMatch.id, 'HT')}
                        graphicType="HT"
                        appSettings={appSettings}
                      />
                      <div className="output-preview-actions">
                        <button className="btn btn-sm btn-primary" onClick={() => shareResultOutput(timelineMatch, 'HT')} disabled={isExportingResultOutput}>
                          <Share2 size={14} /> Bagikan HT
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => downloadResultOutput(timelineMatch, 'HT')} disabled={isExportingResultOutput}>
                          <Download size={14} /> Unduh HT
                        </button>
                      </div>
                    </div>
                  )}
                <div className="output-preview-item">
                  <div className="output-preview-item-label">Full Time</div>
                  <ResultOutputGraphicCard
                    match={timelineMatch}
                    competitions={competitions}
                    elementId={getResultOutputElementId(timelineMatch.id, 'FT')}
                    graphicType="FT"
                    appSettings={appSettings}
                  />
                  <div className="output-preview-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => shareResultOutput(timelineMatch, 'FT')} disabled={isExportingResultOutput}>
                      <Share2 size={14} /> Bagikan FT
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => downloadResultOutput(timelineMatch, 'FT')} disabled={isExportingResultOutput}>
                      <Download size={14} /> Unduh FT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultOutputGraphicCard({ match, competitions, elementId, graphicType, appSettings }: {
  match: Match;
  competitions: Competition[];
  elementId: string;
  graphicType: 'HT' | 'FT';
  appSettings: AppSettings;
}) {
  type TimelineOutputEvent = { id?: string; minute?: number; type?: string; playerName?: string; clubId?: string };
  const events = (getMatchTimelineEvents(match.timeline) as TimelineOutputEvent[]).slice().sort((a, b) => (a.minute || 0) - (b.minute || 0));
  const goalEvents = events.filter(event => event.type === 'goal' && (graphicType === 'FT' || (event.minute || 0) <= 45));
  const comp = competitions.find(c => c.name === match.competition);
  const resultGraphicSettings = getResultGraphicSettings(match);
  const backgroundImage = resultGraphicSettings.backgroundImage || null;
  const backgroundPositionX = resultGraphicSettings.backgroundPositionX ?? 50;
  const backgroundPositionY = resultGraphicSettings.backgroundPositionY ?? 50;
  const backgroundZoom = resultGraphicSettings.backgroundZoom ?? 100;
  const backgroundDim = resultGraphicSettings.backgroundDim ?? 20;
  const scoreHome = graphicType === 'HT' ? match.halfTimeHomeScore ?? 0 : match.homeScore ?? 0;
  const scoreAway = graphicType === 'HT' ? match.halfTimeAwayScore ?? 0 : match.awayScore ?? 0;
  const hasHalfTimeScore = hasSavedHalfTimeResult(match) &&
    match.halfTimeHomeScore !== undefined && match.halfTimeHomeScore !== null &&
    match.halfTimeAwayScore !== undefined && match.halfTimeAwayScore !== null;
  const renderLogo = (logo: string, fallback: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} />
      : <span style={{ fontSize: 24 }}>{logo || fallback}</span>
  );

  return (
    <div id={elementId} style={{
      width: 400,
      height: 500,
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
          {/* Subtle bottom scoreboard overlay for legibility on light background images */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '180px',
              background: 'linear-gradient(to top, rgba(10, 10, 10, 0.7) 0%, rgba(10, 10, 10, 0.35) 50%, rgba(10, 10, 10, 0) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
          {/* Subtle top header overlay for legibility on light background images */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.45) 0%, rgba(10, 10, 10, 0) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(rgba(10, 10, 10, ${Math.max(backgroundDim - 12, 0) / 100}) 0%, rgba(10, 10, 10, ${backgroundDim / 100}) 45%, rgba(10, 10, 10, ${Math.min(backgroundDim + 45, 85) / 100}) 90%)`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: '8px 0',
        marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {comp?.logoUrl && comp.logoUrl.startsWith('http')
            ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
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
            display: 'inline-block',
            maxWidth: 120,
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}>
            {match.competition || 'LIGA NUSANTARA UTAMA'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        zIndex: 2,
        backgroundColor: 'transparent',
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {renderLogo(match.homeLogo, 'H')}
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.7)' }}>
              {match.homeClubName.split(' ')[0] || 'HOME'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 8, fontWeight: 800, backgroundColor: '#c8a84b', color: '#0a0a0a', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {graphicType === 'HT' ? 'HALF TIME' : 'FULL TIME'}
              </span>
              {appSettings.appLogoSrc && (
                <img src={appSettings.appLogoSrc} alt={appSettings.appName} style={{ height: 20, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', justifyContent: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' }}>{scoreHome}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#e2e8f0', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>-</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' }}>{scoreAway}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {renderLogo(match.awayLogo, 'A')}
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right', textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.7)' }}>
              {match.awayClubName.split(' ')[0] || 'AWAY'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 6, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
          {graphicType === 'FT' && hasHalfTimeScore
            ? `HALF TIME: ${match.halfTimeHomeScore} - ${match.halfTimeAwayScore}`
            : (match.venue || 'Stadion Pertandingan')}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, width: '100%', fontSize: 9 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {goalEvents
              .filter(event => String(event.clubId) === String(match.homeClubId))
              .map((event, index) => (
                <div key={event.id || `home-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  <span style={{ color: '#c8a84b', fontWeight: 700 }}>{event.minute || 0}'</span>
                  <span>Goal {event.playerName}</span>
                </div>
              ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
            {goalEvents
              .filter(event => String(event.clubId) === String(match.awayClubId))
              .map((event, index) => (
                <div key={event.id || `away-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', flexDirection: 'row-reverse', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  <span style={{ color: '#c8a84b', fontWeight: 700 }}>{event.minute || 0}'</span>
                  <span>{event.playerName} Goal</span>
                </div>
              ))}
          </div>
        </div>
        {goalEvents.length === 0 && (
          <div style={{ fontSize: 9, color: '#a0aec0', textAlign: 'center', fontStyle: 'italic', padding: '2px 0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>Tidak ada gol tercipta</div>
        )}
      </div>

      <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 6, fontSize: 8, color: '#a0aec0', fontWeight: 600, marginTop: 8, width: '100%', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
        <span>{appSettings.appHandle}</span>
      </div>
    </div>
  );
}
