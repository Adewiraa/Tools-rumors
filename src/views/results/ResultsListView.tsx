'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  getMatchMediaSettings,
  getMatchTimelineEvents
} from '@/logic/utils';
import type { AppSettings, MatchMediaAdItem } from '@/logic/utils';
import { getMatchMediaPages, hasMatchMediaPage, MatchMediaPageCard } from '@/views/shared/MatchMediaAd';

type ResultOutputType = 'HT' | 'FT' | 'AD';
type ResultPreviewTarget = { type: ResultOutputType; adIndex: number };
type GeneratedResultOutput = { dataUrl: string; blob: Blob; fileName: string };
type ResultOutputCacheKey = string;

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
  const [activeResultPreview, setActiveResultPreview] = useState<ResultPreviewTarget>({ type: 'FT', adIndex: 0 });
  const [isExportingResultOutput, setIsExportingResultOutput] = useState(false);
  const [preparedOutputKeys, setPreparedOutputKeys] = useState<Set<ResultOutputCacheKey>>(new Set());
  const resultOutputCacheRef = useRef<Map<ResultOutputCacheKey, GeneratedResultOutput>>(new Map());

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

  const renderMatchLogo = (logo?: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" className="schedule-team-logo" />
      : <span className="schedule-team-logo-text">{logo || '-'}</span>
  );

  const renderCompetitionLogo = (logo?: string, name?: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" className="schedule-competition-logo" />
      : <span className="schedule-competition-logo-text" aria-hidden="true">{logo || name?.slice(0, 2).toUpperCase() || 'KO'}</span>
  );

  const getResultOutputElementId = (matchId: string, type: ResultOutputType, adIndex = 0) => (
    type === 'AD'
      ? `result-output-card-${matchId}-ad-${adIndex + 1}`
      : `result-output-card-${matchId}-${type.toLowerCase()}`
  );
  const getResultPreviewElementId = (matchId: string, type: ResultOutputType, adIndex = 0) => (
    `${getResultOutputElementId(matchId, type, adIndex)}-preview`
  );
  const getResultOutputCacheKey = (matchId: string, type: ResultOutputType, adIndex = 0): ResultOutputCacheKey => (
    `${matchId}:${type}:${adIndex}`
  );
  const getResultOutputFileName = (match: Match, type: ResultOutputType, adIndex = 0) => (
    type === 'AD'
      ? `Result_AD_${adIndex + 1}_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`
      : `Result_${type}_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`
  ).replace(/[^\w.-]+/g, '_');

  const createResultOutputImage = async (match: Match, type: ResultOutputType, adIndex = 0): Promise<GeneratedResultOutput> => {
    const node = document.getElementById(getResultOutputElementId(match.id, type, adIndex));
    if (!node) throw new Error(type === 'AD' ? 'Halaman iklan belum siap.' : 'Gambar hasil belum siap.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob, fileName: getResultOutputFileName(match, type, adIndex) };
  };

  const prepareResultOutputImage = async (match: Match, type: ResultOutputType, adIndex = 0) => {
    const key = getResultOutputCacheKey(match.id, type, adIndex);
    const cached = resultOutputCacheRef.current.get(key);
    if (cached) return cached;

    const output = await createResultOutputImage(match, type, adIndex);
    resultOutputCacheRef.current.set(key, output);
    setPreparedOutputKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    return output;
  };

  const downloadGeneratedOutputs = (outputs: Pick<GeneratedResultOutput, 'dataUrl' | 'fileName'>[]) => {
    outputs.forEach(output => {
      const link = document.createElement('a');
      link.download = output.fileName;
      link.href = output.dataUrl;
      link.click();
    });
  };

  const canShareFiles = (nav: Navigator & { canShare?: (data: ShareData) => boolean }, shareData: ShareData) => {
    try {
      return typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData);
    } catch (error) {
      console.warn('Result output canShare check failed:', error);
      return false;
    }
  };

  const downloadResultOutput = async (match: Match, type: ResultOutputType, adIndex = 0) => {
    const outputLabel = type === 'AD' ? `iklan ${adIndex + 1}` : type;
    try {
      setIsExportingResultOutput(true);
      triggerToast(`Membuat gambar ${outputLabel}...`);
      const { dataUrl, fileName } = await createResultOutputImage(match, type, adIndex);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast(`Gambar ${outputLabel} berhasil diunduh!`);
    } catch (err) {
      console.warn('Result output download failed:', err);
      triggerToast(`Gagal mengunduh gambar ${outputLabel}.`, 'error');
    } finally {
      setIsExportingResultOutput(false);
    }
  };

  const shareResultOutput = async (match: Match, type: ResultOutputType, adIndex = 0) => {
    const outputLabel = type === 'AD' ? `Iklan ${adIndex + 1}` : type;
    const key = getResultOutputCacheKey(match.id, type, adIndex);
    const cachedOutput = resultOutputCacheRef.current.get(key);

    if (!cachedOutput) {
      triggerToast(`Gambar ${outputLabel} sedang disiapkan. Coba bagikan lagi sebentar.`, 'warning');
      void prepareResultOutputImage(match, type, adIndex).catch(error => {
        console.warn('Result output preparation failed:', error);
        triggerToast(`Gagal menyiapkan gambar ${outputLabel}.`, 'error');
      });
      return;
    }

    try {
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const files = [new File([cachedOutput.blob], cachedOutput.fileName, { type: 'image/png' })];
      const shareData: ShareData = {
        files,
        title: `${outputLabel} ${match.homeClubName} vs ${match.awayClubName}`,
        text: type === 'AD'
          ? `Halaman iklan ${match.homeClubName} vs ${match.awayClubName}`
          : `Hasil ${type} ${match.homeClubName} vs ${match.awayClubName}`,
      };

      if (canShareFiles(nav, shareData)) {
        try {
          const sharePromise = nav.share(shareData);
          setIsExportingResultOutput(true);
          await sharePromise;
          triggerToast(`Gambar ${outputLabel} siap dibagikan.`);
        } catch (shareError) {
          const error = shareError as { name?: string };
          if (error?.name === 'AbortError') return;
          console.warn('Result output native share failed, falling back to download:', shareError);
        }
      }

      downloadGeneratedOutputs([cachedOutput]);
      triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.warn('Result output share failed:', err);
        triggerToast(`Gagal membagikan gambar ${outputLabel}.`, 'error');
      }
    } finally {
      setIsExportingResultOutput(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/results?edit=${id}`);
  };

  const canShowHalfTimeOutput = (match: Match) => (
    hasSavedHalfTimeResult(match) &&
    match.halfTimeHomeScore !== undefined &&
    match.halfTimeHomeScore !== null &&
    match.halfTimeAwayScore !== undefined &&
    match.halfTimeAwayScore !== null
  );

  const canShowFullTimeOutput = (match: Match) => (
    match.homeScore !== undefined &&
    match.homeScore !== null &&
    match.awayScore !== undefined &&
    match.awayScore !== null
  );

  const openResultPreview = (match: Match) => {
    resultOutputCacheRef.current.clear();
    setPreparedOutputKeys(new Set());
    setTimelineMatch(match);
    setActiveResultPreview({ type: canShowHalfTimeOutput(match) ? 'HT' : 'FT', adIndex: 0 });
  };

  useEffect(() => {
    if (!timelineMatch) return;

    resultOutputCacheRef.current.clear();
    setPreparedOutputKeys(new Set());
  }, [timelineMatch?.id]);

  useEffect(() => {
    if (!timelineMatch) return;

    const outputTargets: ResultPreviewTarget[] = [];
    if (canShowHalfTimeOutput(timelineMatch)) outputTargets.push({ type: 'HT', adIndex: 0 });
    if (canShowFullTimeOutput(timelineMatch)) outputTargets.push({ type: 'FT', adIndex: 0 });
    getMatchMediaPages(getMatchMediaSettings(timelineMatch)).forEach((_, index) => {
      outputTargets.push({ type: 'AD', adIndex: index });
    });

    const timer = window.setTimeout(() => {
      outputTargets.forEach(target => {
        void prepareResultOutputImage(timelineMatch, target.type, target.adIndex).catch(error => {
          console.warn(`Result output ${target.type} preparation failed:`, error);
        });
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [timelineMatch, appSettings, competitions]);

  return (
    <div className="schedule-page-root">
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
      <div className="card schedule-filter-card">
        <select className="form-select schedule-filter-competition" value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
          <option value="Semua">Semua Kompetisi</option>
          {competitions.map(comp => (
            <option key={comp.id} value={comp.name}>{comp.name}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="table-wrapper schedule-table-wrapper">
        <table className="data-table schedule-table">
          <thead>
            <tr>
              <th>Pertandingan</th>
              <th>Kompetisi</th>
              <th>Kickoff</th>
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
              const competition = competitions.find(c => c.name === match.competition);
              const kickoffDate = new Date(match.kickoff);
              const kickoffDateLabel = kickoffDate.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
              const kickoffTimeLabel = kickoffDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              const canInputResult = (effectiveStatus === 'Live' || hasSavedHalfTime) && (getEffectiveLineupStatus(match) === 'Complete' || hasSavedHalfTime);
              return (
                <tr key={match.id}>
                  <td className="schedule-match-cell">
                    <div className="schedule-match-teams">
                      <span className="schedule-team schedule-team-home">
                        {renderMatchLogo(match.homeLogo)}
                        <span className="schedule-team-name">{match.homeClubName}</span>
                      </span>
                      <span className="schedule-versus">vs</span>
                      <span className="schedule-team schedule-team-away">
                        {renderMatchLogo(match.awayLogo)}
                        <span className="schedule-team-name">{match.awayClubName}</span>
                      </span>
                    </div>
                  </td>
                  <td className="schedule-info-cell" data-label="Kompetisi">
                    <span className="schedule-competition-value">
                      {renderCompetitionLogo(competition?.logoUrl, match.competition)}
                      <span>{match.competition}</span>
                    </span>
                  </td>
                  <td className="schedule-info-cell schedule-kickoff-cell" data-label="Kickoff">
                    <span className="schedule-kickoff-value">{kickoffDateLabel}, {kickoffTimeLabel} WIB</span>
                  </td>
                  <td className="schedule-info-cell" data-label="HT">
                    {hasSavedHalfTime && hasHalfTimeScoreValues(match) ? (
                      <span className="schedule-score schedule-score-half">{match.halfTimeHomeScore} - {match.halfTimeAwayScore}</span>
                    ) : (
                      <span className="schedule-empty-score">-</span>
                    )}
                  </td>
                  <td className="schedule-info-cell" data-label="FT">
                    {match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null ? (
                      <span className="schedule-score schedule-score-full">{match.homeScore} - {match.awayScore}</span>
                    ) : (
                      <span className="schedule-empty-score">-</span>
                    )}
                  </td>
                  <td className="schedule-info-cell" data-label="Status">
                    <span className={`badge ${effectiveStatus === 'Finished' ? 'badge-success' : effectiveStatus === 'Live' ? 'badge-danger' : 'badge-warning'}`}>
                      {statusLabel(effectiveStatus)}
                    </span>
                  </td>
                  <td className="schedule-info-cell" data-label="Lineup">
                    <span className={`badge ${lineupStatusClass(match)}`}>
                      {lineupStatusLabel(match)}
                    </span>
                  </td>
                  <td className="schedule-info-cell" data-label="Publikasi">
                    <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                      {match.publicationStatus}
                    </span>
                  </td>
                  <td className="schedule-actions-cell text-right">
                    <div className="schedule-actions">
                      {hasResultProgress(match) ? (
                        <button className="btn btn-sm btn-secondary" onClick={() => openResultPreview(match)}>
                          <Info size={13} /> Lihat Gambar
                        </button>
                      ) : hasPermission('Match Result', 'create_edit') && (
                        <button className="btn btn-sm btn-secondary" disabled={!canInputResult} title={canInputResult ? 'Input hasil HT/FT' : 'Input hasil tersedia saat pertandingan Live dan lineup lengkap'} onClick={() => handleEdit(match.id)}>
                          Input HT/FT
                        </button>
                      )}
                    </div>
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
                <div className="output-preview-meta">{timelineMatch.homeClubName} vs {timelineMatch.awayClubName}</div>
              </div>
              <button className="btn btn-sm btn-secondary output-preview-close" title="Tutup" onClick={() => setTimelineMatch(null)}><X size={16} /></button>
            </div>
            <div className="output-preview-tabs" role="tablist" aria-label="Pilihan gambar hasil">
              {canShowHalfTimeOutput(timelineMatch) && (
                <button
                  type="button"
                  className={`output-preview-tab ${activeResultPreview.type === 'HT' ? 'active' : ''}`}
                  onClick={() => setActiveResultPreview({ type: 'HT', adIndex: 0 })}
                >
                  Half Time
                </button>
              )}
              {canShowFullTimeOutput(timelineMatch) && (
                <button
                  type="button"
                  className={`output-preview-tab ${activeResultPreview.type === 'FT' ? 'active' : ''}`}
                  onClick={() => setActiveResultPreview({ type: 'FT', adIndex: 0 })}
                >
                  Full Time
                </button>
              )}
              {getMatchMediaPages(getMatchMediaSettings(timelineMatch)).map((ad, index) => (
                <button
                  type="button"
                  key={ad.id || index}
                  className={`output-preview-tab ${activeResultPreview.type === 'AD' && activeResultPreview.adIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveResultPreview({ type: 'AD', adIndex: index })}
                >
                  Media Iklan {index + 1}
                </button>
              ))}
            </div>
            <div className="output-preview-stage">
              {(() => {
                const mediaAdPages = getMatchMediaPages(getMatchMediaSettings(timelineMatch));
                const activeAd = mediaAdPages[activeResultPreview.adIndex] || mediaAdPages[0];
                const isActiveAd = activeResultPreview.type === 'AD' && activeAd;
                const activeType = isActiveAd ? 'AD' : activeResultPreview.type === 'HT' && canShowHalfTimeOutput(timelineMatch) ? 'HT' : 'FT';
                const activeGraphicType: 'HT' | 'FT' = activeType === 'HT' ? 'HT' : 'FT';
                const activeLabel = activeType === 'HT' ? 'Half Time' : activeType === 'FT' ? 'Full Time' : `Media Iklan ${activeResultPreview.adIndex + 1}`;
                const activeOutputReady = preparedOutputKeys.has(getResultOutputCacheKey(timelineMatch.id, activeType, activeResultPreview.adIndex));

                return (
                  <div className="output-preview-item output-preview-active-card">
                    <div className="output-preview-item-label">{activeLabel}</div>
                    {activeType === 'AD' && activeAd ? (
                      <ResultOutputAdCard
                        match={timelineMatch}
                        competitions={competitions}
                        elementId={getResultPreviewElementId(timelineMatch.id, 'AD', activeResultPreview.adIndex)}
                        appSettings={appSettings}
                        ad={activeAd}
                        adIndex={activeResultPreview.adIndex}
                        adTotal={mediaAdPages.length}
                      />
                    ) : (
                      <ResultOutputGraphicCard
                        match={timelineMatch}
                        competitions={competitions}
                        elementId={getResultPreviewElementId(timelineMatch.id, activeGraphicType)}
                        graphicType={activeGraphicType}
                        appSettings={appSettings}
                      />
                    )}
                    <div className="output-preview-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => shareResultOutput(timelineMatch, activeType, activeResultPreview.adIndex)}
                        disabled={isExportingResultOutput || !activeOutputReady}
                        title={activeOutputReady ? `Bagikan ${activeType}` : 'Gambar sedang disiapkan'}
                      >
                        <Share2 size={14} /> {activeOutputReady ? `Bagikan ${activeType === 'AD' ? 'Iklan' : activeType}` : 'Menyiapkan...'}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => downloadResultOutput(timelineMatch, activeType, activeResultPreview.adIndex)}
                        disabled={isExportingResultOutput}
                      >
                        <Download size={14} /> Unduh {activeType === 'AD' ? 'Iklan' : activeType}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="result-output-export-deck" aria-hidden="true">
              {canShowHalfTimeOutput(timelineMatch) && (
                <ResultOutputGraphicCard
                  match={timelineMatch}
                  competitions={competitions}
                  elementId={getResultOutputElementId(timelineMatch.id, 'HT')}
                  graphicType="HT"
                  appSettings={appSettings}
                />
              )}
              {canShowFullTimeOutput(timelineMatch) && (
                <ResultOutputGraphicCard
                  match={timelineMatch}
                  competitions={competitions}
                  elementId={getResultOutputElementId(timelineMatch.id, 'FT')}
                  graphicType="FT"
                  appSettings={appSettings}
                />
              )}
              {getMatchMediaPages(getMatchMediaSettings(timelineMatch)).map((ad, index) => (
                <ResultOutputAdCard
                  key={ad.id || index}
                  match={timelineMatch}
                  competitions={competitions}
                  elementId={getResultOutputElementId(timelineMatch.id, 'AD', index)}
                  appSettings={appSettings}
                  ad={ad}
                  adIndex={index}
                  adTotal={getMatchMediaPages(getMatchMediaSettings(timelineMatch)).length}
                />
              ))}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} />
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
            {appSettings.appLogoSrc && (
              <img src={appSettings.appLogoSrc} alt={appSettings.appName} style={{ height: 22, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))', marginBottom: 2 }} />
            )}
            <span style={{ fontSize: 8, fontWeight: 800, backgroundColor: '#c8a84b', color: '#0a0a0a', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {graphicType === 'HT' ? 'HALF TIME' : 'FULL TIME'}
            </span>
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
                  <span style={{ color: '#c8a84b', fontWeight: 700 }}>{`${event.minute || 0}'`}</span>
                  <span>Goal {event.playerName}</span>
                </div>
              ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
            {goalEvents
              .filter(event => String(event.clubId) === String(match.awayClubId))
              .map((event, index) => (
                <div key={event.id || `away-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', flexDirection: 'row-reverse', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  <span style={{ color: '#c8a84b', fontWeight: 700 }}>{`${event.minute || 0}'`}</span>
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

function ResultOutputAdCard({ match, competitions, elementId, appSettings, ad, adIndex, adTotal }: {
  match: Match;
  competitions: Competition[];
  elementId: string;
  appSettings: AppSettings;
  ad: MatchMediaAdItem;
  adIndex: number;
  adTotal: number;
}) {
  const comp = competitions.find(c => c.name === match.competition);
  const resultGraphicSettings = getResultGraphicSettings(match);

  return (
    <MatchMediaPageCard
      elementId={elementId}
      settings={getMatchMediaSettings(match)}
      ad={ad}
      width={400}
      height={500}
      appSettings={appSettings}
      competitionName={match.competition}
      competitionLogo={comp?.logoUrl}
      matchTitle={`${match.homeClubName} vs ${match.awayClubName}`}
      backgroundImage={resultGraphicSettings.backgroundImage || null}
      backgroundPositionX={resultGraphicSettings.backgroundPositionX ?? 50}
      backgroundPositionY={resultGraphicSettings.backgroundPositionY ?? 50}
      backgroundZoom={resultGraphicSettings.backgroundZoom ?? 100}
      backgroundDim={resultGraphicSettings.backgroundDim ?? 20}
      slideIndex={adIndex + 1}
      slideTotal={adTotal}
    />
  );
}
