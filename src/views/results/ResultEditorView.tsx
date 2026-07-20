'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Match, Player, Club, Competition } from '@/lib/mockData';
import { ArrowLeft, Search, Share2, Download, X } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import {
  getEffectiveMatchStatus,
  getResultGraphicSettings,
  hasSavedHalfTimeResult,
  getMatchTimelineEvents,
  getTimelineWithResultGraphicSettings,
  hasHalfTimeScoreValues,
  getEffectiveLineupStatus,
  ResultGraphicSettings
} from '@/logic/utils';
import LoadingButton from '@/views/shared/LoadingButton';

interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  playerName: string;
  clubId: string;
}

export default function ResultEditorView({ matchId }: { matchId: string }) {
  const router = useRouter();
  const {
    appSettings,
    matches,
    setMatches,
    clubs,
    players,
    competitions,
    logAction,
    triggerToast
  } = useApp();

  const foundMatch = matches.find(m => m.id === matchId);
  const matchMissing = !foundMatch;
  const match: Match = foundMatch || {
    id: matchId,
    homeClubId: '',
    homeClubName: '',
    homeLogo: '',
    awayClubId: '',
    awayClubName: '',
    awayLogo: '',
    competition: '',
    season: '',
    kickoff: new Date().toISOString(),
    venue: '',
    status: 'Scheduled',
    lineupStatus: 'Draft',
    publicationStatus: 'Draft',
    editor: 'Admin',
    lastUpdated: '',
  };

  const effectiveInitialStatus = getEffectiveMatchStatus(match);
  const initialResultGraphicSettings = getResultGraphicSettings(match);
  const halfTimeWasSaved = hasSavedHalfTimeResult(match);

  // Editor states
  const [homeScore, setHomeScore] = useState<number | ''>(
    effectiveInitialStatus === 'Finished' && match.homeScore !== undefined && match.homeScore !== null ? match.homeScore : 0
  );
  const [awayScore, setAwayScore] = useState<number | ''>(
    effectiveInitialStatus === 'Finished' && match.awayScore !== undefined && match.awayScore !== null ? match.awayScore : 0
  );
  const [halfTimeHomeScore, setHalfTimeHomeScore] = useState<number | ''>(
    match.halfTimeHomeScore !== undefined && match.halfTimeHomeScore !== null ? match.halfTimeHomeScore : 0
  );
  const [halfTimeAwayScore, setHalfTimeAwayScore] = useState<number | ''>(
    match.halfTimeAwayScore !== undefined && match.halfTimeAwayScore !== null ? match.halfTimeAwayScore : 0
  );
  const [matchStatus, setMatchStatus] = useState<'Scheduled' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled'>(effectiveInitialStatus);
  const [showFullTime, setShowFullTime] = useState<boolean>(effectiveInitialStatus === 'Finished');
  const [isSaving, setIsSaving] = useState(false);

  // Instagram graphic options
  const [graphicType, setGraphicType] = useState<'HT' | 'FT'>(effectiveInitialStatus === 'Finished' ? 'FT' : 'HT');
  const [graphicRatio, setGraphicRatio] = useState<'1:1' | '4:5'>('1:1');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(initialResultGraphicSettings.backgroundImage || null);
  const [pendingBackgroundImage, setPendingBackgroundImage] = useState<string | null>(null);
  const [backgroundPositionX, setBackgroundPositionX] = useState(initialResultGraphicSettings.backgroundPositionX ?? 50);
  const [backgroundPositionY, setBackgroundPositionY] = useState(initialResultGraphicSettings.backgroundPositionY ?? 50);
  const [backgroundZoom, setBackgroundZoom] = useState(initialResultGraphicSettings.backgroundZoom ?? 100);
  const [backgroundDim, setBackgroundDim] = useState(initialResultGraphicSettings.backgroundDim ?? 20);
  const [pendingBackgroundPositionX, setPendingBackgroundPositionX] = useState(initialResultGraphicSettings.backgroundPositionX ?? 50);
  const [pendingBackgroundPositionY, setPendingBackgroundPositionY] = useState(initialResultGraphicSettings.backgroundPositionY ?? 50);
  const [pendingBackgroundZoom, setPendingBackgroundZoom] = useState(initialResultGraphicSettings.backgroundZoom ?? 100);
  const [pendingBackgroundDim, setPendingBackgroundDim] = useState(initialResultGraphicSettings.backgroundDim ?? 20);
  const [isExportingGraphic, setIsExportingGraphic] = useState(false);
  const isFullTimeGraphic = showFullTime || matchStatus === 'Finished';
  const effectiveGraphicType: 'HT' | 'FT' = isFullTimeGraphic ? 'FT' : graphicType;
  const isHtScoresFilled = halfTimeHomeScore !== '' && halfTimeHomeScore !== undefined && halfTimeHomeScore !== null &&
                          halfTimeAwayScore !== '' && halfTimeAwayScore !== undefined && halfTimeAwayScore !== null;
  const isFtScoresFilled = homeScore !== '' && homeScore !== undefined && homeScore !== null &&
                          awayScore !== '' && awayScore !== undefined && awayScore !== null;
  const isGraphicScoresFilled = effectiveGraphicType === 'FT' ? isFtScoresFilled : isHtScoresFilled;
  const shouldShowHalfTimeInFullTimeGraphic = halfTimeWasSaved && isHtScoresFilled;

  // Active live preview background values
  const currentShowImage = pendingBackgroundImage || backgroundImage;
  const currentShowPositionX = pendingBackgroundImage ? pendingBackgroundPositionX : backgroundPositionX;
  const currentShowPositionY = pendingBackgroundImage ? pendingBackgroundPositionY : backgroundPositionY;
  const currentShowZoom = pendingBackgroundImage ? pendingBackgroundZoom : backgroundZoom;
  const currentShowDim = pendingBackgroundImage ? pendingBackgroundDim : backgroundDim;

  useEffect(() => {
    if (isFullTimeGraphic && graphicType !== 'FT') {
      setGraphicType('FT');
    }
  }, [graphicType, isFullTimeGraphic]);

  const applyPendingBackgroundImage = () => {
    if (!pendingBackgroundImage) return;
    setBackgroundImage(pendingBackgroundImage);
    setBackgroundPositionX(pendingBackgroundPositionX);
    setBackgroundPositionY(pendingBackgroundPositionY);
    setBackgroundZoom(pendingBackgroundZoom);
    setBackgroundDim(pendingBackgroundDim);
    triggerToast('Gambar background diterapkan.');
  };

  const resetBackgroundImageDraft = () => {
    setPendingBackgroundImage(null);
    setPendingBackgroundPositionX(backgroundPositionX);
    setPendingBackgroundPositionY(backgroundPositionY);
    setPendingBackgroundZoom(backgroundZoom);
    setPendingBackgroundDim(backgroundDim);
  };

  // Safety confirmation states
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [safetyReason, setSafetyReason] = useState('');

  // Timeline events state
  const [events, setEvents] = useState<MatchEvent[]>(
    Array.isArray(match.timeline) && match.timeline.length > 0
      ? getMatchTimelineEvents(match.timeline) as MatchEvent[]
      : []
  );

  // Helper to load roster players from lineup
  const getLineupPlayersForClub = (clubId: string) => {
    const isHome = clubId === match.homeClubId;
    const startersIds = isHome ? (match.homeStarters || []) : (match.awayStarters || []);
    const subsIds = isHome ? (match.homeSubs || []) : (match.awaySubs || []);
    const asingPlayers = isHome ? (match.homeAsing || []) : (match.awayAsing || []);

    const localStarters = players.filter(p => startersIds.includes(p.id));
    const localSubs = players.filter(p => subsIds.includes(p.id));

    const list: { id: string; name: string; number?: number; isForeign?: boolean }[] = [];

    localStarters.forEach(p => {
      list.push({ id: p.id, name: p.displayName || p.fullName, number: p.shirtNumber });
    });

    localSubs.forEach(p => {
      list.push({ id: p.id, name: p.displayName || p.fullName, number: p.shirtNumber });
    });

    asingPlayers.forEach((p: any) => {
      list.push({ id: p.id, name: p.name, number: p.no, isForeign: true });
    });

    return list;
  };

  const shareResultGraphic = async () => {
    const node = document.getElementById('match-feed-card');
    if (!node) return;
    try {
      setIsExportingGraphic(true);
      triggerToast('Membuat gambar untuk dibagikan...');
      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: 2.7,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const graphicLabel = effectiveGraphicType === 'HT' ? 'Halftime' : 'Fulltime';
      const fileName = `Result_${graphicLabel}_${match.homeClubName}_vs_${match.awayClubName}_${graphicRatio.replace(':', '_')}.png`.replace(/[^\w.-]+/g, '_');
      const file = new File([blob], fileName, { type: 'image/png' });
      
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: `${match.homeClubName} vs ${match.awayClubName} (${graphicLabel})`,
        text: `Hasil pertandingan ${match.homeClubName} vs ${match.awayClubName} - ${graphicLabel}`,
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Gambar siap dibagikan.');
        return;
      }

      // Fallback to download
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Bagikan langsung tidak didukung di perangkat ini. Gambar diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.error('Failed to share result graphic:', err);
        triggerToast('Gagal membagikan gambar.', 'error');
      }
    } finally {
      setIsExportingGraphic(false);
    }
  };

  const downloadResultGraphic = async () => {
    const node = document.getElementById('match-feed-card');
    if (!node) return;
    try {
      setIsExportingGraphic(true);
      triggerToast('Mengunduh gambar...');
      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: 2.7,
      });
      const graphicLabel = effectiveGraphicType === 'HT' ? 'Halftime' : 'Fulltime';
      const fileName = `Result_${graphicLabel}_${match.homeClubName}_vs_${match.awayClubName}_${graphicRatio.replace(':', '_')}.png`.replace(/[^\w.-]+/g, '_');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Gambar berhasil diunduh!');
    } catch (err) {
      console.error('Failed to download result graphic:', err);
      triggerToast('Gagal mengunduh gambar.', 'error');
    } finally {
      setIsExportingGraphic(false);
    }
  };

  // Form event handlers
  const [newEventMinute, setNewEventMinute] = useState(45);
  const [newEventType, setNewEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'substitution'>('goal');
  const [newEventPlayer, setNewEventPlayer] = useState('');
  const [newEventPlayerSearch, setNewEventPlayerSearch] = useState('');
  const [isEventPlayerSelectOpen, setIsEventPlayerSelectOpen] = useState(false);
  const [newEventClub, setNewEventClub] = useState(match.homeClubId);

  const getFilteredLineupPlayersForClub = (clubId: string) => {
    const normalizedQuery = newEventPlayerSearch.trim().toLowerCase();
    const lineupPlayers = getLineupPlayersForClub(clubId);
    if (!normalizedQuery) return lineupPlayers;

    return lineupPlayers.filter(player => [
      player.name,
      String(player.number || ''),
      player.isForeign ? 'asing' : '',
    ].some(value => value.toLowerCase().includes(normalizedQuery)));
  };

  const eventPlayerOptions = getFilteredLineupPlayersForClub(newEventClub);

  const addEvent = () => {
    if (!newEventPlayer) {
      triggerToast('Pilih pemain terlebih dahulu.', 'error');
      return;
    }

    if (newEventType === 'goal') {
      const isHome = String(newEventClub) === String(match.homeClubId);
      const limitHT = isHome ? halfTimeHomeScore : halfTimeAwayScore;
      const limitFT = isHome ? homeScore : awayScore;

      const currentHTGoalsCount = events.filter(
        e => e.type === 'goal' && String(e.clubId) === String(newEventClub) && e.minute <= 45
      ).length;

      const currentTotalGoalsCount = events.filter(
        e => e.type === 'goal' && String(e.clubId) === String(newEventClub)
      ).length;

      const shouldValidateAgainstHalfTime = newEventMinute <= 45 && (!showFullTime || halfTimeWasSaved);

      if (shouldValidateAgainstHalfTime) {
        const targetHT = (limitHT === '' ? 0 : Number(limitHT));
        if (currentHTGoalsCount + 1 > targetHT) {
          triggerToast(
            `Peringatan: Jumlah gol babak pertama (${isHome ? 'Home' : 'Away'}) di timeline (${currentHTGoalsCount + 1}) melebihi skor HT (${targetHT})!`,
            'warning'
          );
          return;
        }
      } else {
        if (!showFullTime) {
          triggerToast('Peringatan: Aktifkan "Pertandingan Selesai" terlebih dahulu untuk menambahkan gol babak kedua!', 'warning');
          return;
        }
        const targetFT = (limitFT === '' ? 0 : Number(limitFT));
        if (currentTotalGoalsCount + 1 > targetFT) {
          triggerToast(
            `Peringatan: Total gol (${isHome ? 'Home' : 'Away'}) di timeline (${currentTotalGoalsCount + 1}) melebihi skor FT (${targetFT})!`,
            'warning'
          );
          return;
        }
      }
    }

    const evt: MatchEvent = {
      id: `${Date.now()}`,
      minute: newEventMinute,
      type: newEventType,
      playerName: newEventPlayer,
      clubId: newEventClub
    };
    setEvents(prev => [...prev, evt].sort((a, b) => a.minute - b.minute));
    triggerToast('Event berhasil ditambahkan ke timeline!');
  };

  if (matchMissing) {
    return (
      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Pertandingan tidak ditemukan</h2>
        <p className="text-muted" style={{ marginBottom: 16 }}>Pilih pertandingan dari jadwal atau lineup yang sudah lengkap.</p>
        <button className="btn btn-sm btn-secondary" onClick={() => router.push('/results')}><ArrowLeft size={16} /> Kembali</button>
      </div>
    );
  }

  const handleSaveWithSafetyCheck = () => {
    if (isSaving) return;
    const isFtHomeFilled = homeScore !== '' && homeScore !== undefined;
    const isFtAwayFilled = awayScore !== '' && awayScore !== undefined;
    const isHtHomeFilled = halfTimeHomeScore !== '' && halfTimeHomeScore !== undefined;
    const isHtAwayFilled = halfTimeAwayScore !== '' && halfTimeAwayScore !== undefined;
    const isSavingFullTime = showFullTime || matchStatus === 'Finished';
    const shouldPersistHalfTime = !isSavingFullTime || halfTimeWasSaved;
    const nextHomeScore = showFullTime ? (homeScore === '' ? null : homeScore) : null;
    const nextAwayScore = showFullTime ? (awayScore === '' ? null : awayScore) : null;
    const nextHalfTimeHomeScore = shouldPersistHalfTime ? (halfTimeHomeScore === '' ? null : halfTimeHomeScore) : null;
    const nextHalfTimeAwayScore = shouldPersistHalfTime ? (halfTimeAwayScore === '' ? null : halfTimeAwayScore) : null;

    if (showFullTime && shouldPersistHalfTime) {
      if ((isHtHomeFilled && isFtHomeFilled && (halfTimeHomeScore as number) > (homeScore as number)) ||
          (isHtAwayFilled && isFtAwayFilled && (halfTimeAwayScore as number) > (awayScore as number))) {
        triggerToast('Skor half time tidak boleh lebih besar dari skor akhir.', 'error');
        return;
      }
    }

    if (shouldPersistHalfTime) {
      const htHomeGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.homeClubId) && e.minute <= 45).length;
      const htAwayGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.awayClubId) && e.minute <= 45).length;

      const targetHtHome = halfTimeHomeScore === '' ? 0 : Number(halfTimeHomeScore);
      const targetHtAway = halfTimeAwayScore === '' ? 0 : Number(halfTimeAwayScore);

      if (htHomeGoals > targetHtHome) {
        triggerToast(`Jumlah gol HT Home di timeline (${htHomeGoals}) melebihi skor HT (${targetHtHome})!`, 'error');
        return;
      }
      if (htAwayGoals > targetHtAway) {
        triggerToast(`Jumlah gol HT Away di timeline (${htAwayGoals}) melebihi skor HT (${targetHtAway})!`, 'error');
        return;
      }
    }

    if (isSavingFullTime) {
      const ftHomeGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.homeClubId)).length;
      const ftAwayGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.awayClubId)).length;
      
      const targetFtHome = homeScore === '' ? 0 : Number(homeScore);
      const targetFtAway = awayScore === '' ? 0 : Number(awayScore);

      if (ftHomeGoals > targetFtHome) {
        triggerToast(`Total gol Home di timeline (${ftHomeGoals}) melebihi skor FT (${targetFtHome})!`, 'error');
        return;
      }
      if (ftAwayGoals > targetFtAway) {
        triggerToast(`Total gol Away di timeline (${ftAwayGoals}) melebihi skor FT (${targetFtAway})!`, 'error');
        return;
      }
    }

    const scoreChanged =
      nextHomeScore !== (match.homeScore ?? null) ||
      nextAwayScore !== (match.awayScore ?? null) ||
      nextHalfTimeHomeScore !== (match.halfTimeHomeScore ?? null) ||
      nextHalfTimeAwayScore !== (match.halfTimeAwayScore ?? null);
    const wasPublished = match.publicationStatus === 'Published';

    if (scoreChanged && wasPublished) {
      setShowReasonModal(true);
    } else {
      submitUpdate();
    }
  };

  const submitUpdate = async () => {
    if (isSaving) return;
    const isSavingFullTime = showFullTime || matchStatus === 'Finished';
    const shouldPersistHalfTime = !isSavingFullTime || halfTimeWasSaved;
    const storedStatus: Match['status'] =
      isSavingFullTime
        ? 'Finished'
        : (matchStatus === 'Postponed' || matchStatus === 'Cancelled' ? matchStatus : 'Scheduled');
    const finalBgImage = pendingBackgroundImage !== null ? pendingBackgroundImage : backgroundImage;
    const finalPositionX = pendingBackgroundImage !== null ? pendingBackgroundPositionX : backgroundPositionX;
    const finalPositionY = pendingBackgroundImage !== null ? pendingBackgroundPositionY : backgroundPositionY;
    const finalZoom = pendingBackgroundImage !== null ? pendingBackgroundZoom : backgroundZoom;
    const finalDim = pendingBackgroundImage !== null ? pendingBackgroundDim : backgroundDim;

    const nextGraphicSettings: ResultGraphicSettings = {
      backgroundImage: finalBgImage,
      backgroundPositionX: finalPositionX,
      backgroundPositionY: finalPositionY,
      backgroundZoom: finalZoom,
      backgroundDim: finalDim,
      halfTimeSaved: shouldPersistHalfTime,
    };
    const nextLineupStatus: Match['lineupStatus'] =
      storedStatus === 'Finished' || getEffectiveLineupStatus(match) === 'Complete'
        ? 'Complete'
        : match.lineupStatus;
    const updatedMatch: Match = {
      ...match,
      homeScore: showFullTime ? (homeScore === '' ? null : (homeScore as any)) : null,
      awayScore: showFullTime ? (awayScore === '' ? null : (awayScore as any)) : null,
      halfTimeHomeScore: shouldPersistHalfTime ? (halfTimeHomeScore === '' ? null : (halfTimeHomeScore as any)) : null,
      halfTimeAwayScore: shouldPersistHalfTime ? (halfTimeAwayScore === '' ? null : (halfTimeAwayScore as any)) : null,
      status: storedStatus,
      lineupStatus: nextLineupStatus,
      timeline: getTimelineWithResultGraphicSettings(events, nextGraphicSettings),
    };

    try {
      setIsSaving(true);
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', match: updatedMatch })
      });
      const result = await res.json();
      if (!result.success) {
        triggerToast(`Gagal menyimpan hasil: ${result.error}`, 'error');
        return;
      }

      if (safetyReason) {
        logAction('SAFETY_TRIGGERED', 'Match Result', `Perubahan skor oleh admin. Alasan: "${safetyReason}"`);
      } else {
        logAction('SAVE_MATCH_RESULT', 'Hasil Pertandingan', `Menyimpan skor ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
      }

      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
      triggerToast('Hasil pertandingan berhasil disimpan!');
      router.push('/results');
    } catch (err: any) {
      triggerToast('Terjadi kesalahan saat menyimpan hasil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const comp = competitions.find(c => c.name === match.competition);
  const scoreHomeToShow = effectiveGraphicType === 'HT'
    ? (halfTimeHomeScore !== '' ? halfTimeHomeScore : 0) 
    : (homeScore !== '' ? homeScore : 0);
  const scoreAwayToShow = effectiveGraphicType === 'HT'
    ? (halfTimeAwayScore !== '' ? halfTimeAwayScore : 0) 
    : (awayScore !== '' ? awayScore : 0);

  const renderLogo = (logo: string, fallback: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} />
      : <span style={{ fontSize: 24 }}>{logo || fallback}</span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Editor Header */}
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={() => router.push('/results')}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Input Hasil & Timeline Pertandingan</h2>
            <div style={{ fontSize: 12, color: 'var(--neutral-50)' }}>{match.competition} · {match.venue}</div>
          </div>
        </div>

        <div className="flex gap-12">
          <LoadingButton className="btn btn-md btn-primary" onClick={handleSaveWithSafetyCheck} loading={isSaving} loadingLabel="Menyimpan...">
            {showFullTime ? 'Simpan Full Time' : 'Simpan Half Time'}
          </LoadingButton>
        </div>
      </div>

      <div className="grid-12">
        {/* Left Side: Scores and Status */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Skor Half Time, Full Time & Status</h3>

          <div className="flex align-center justify-between" style={{ padding: '20px 0', borderBottom: '1px solid var(--neutral-100)' }}>
            {/* Home score HT */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                {match.homeLogo && match.homeLogo.startsWith('http') ? (
                  <img src={match.homeLogo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 30 }}>{match.homeLogo || '⚽'}</span>
                )}
              </div>
              <div className="semibold" style={{ fontSize: 14, margin: '4px 0', color: 'var(--neutral-800)' }}>{match.homeClubName}</div>
              <label className="form-label" style={{ textAlign: 'center', marginTop: 6, fontSize: 11 }}>Skor Babak Pertama (HT)</label>
              <input 
                type="number" 
                min={0} 
                className="form-input" 
                style={{ width: 85, fontSize: 18, textAlign: 'center', margin: '0 auto' }} 
                value={halfTimeHomeScore} 
                onChange={(e) => setHalfTimeHomeScore(e.target.value === '' ? '' : Number(e.target.value))} 
              />
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--neutral-300)' }}>VS</div>

            {/* Away score HT */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                {match.awayLogo && match.awayLogo.startsWith('http') ? (
                  <img src={match.awayLogo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 30 }}>{match.awayLogo || '⚽'}</span>
                )}
              </div>
              <div className="semibold" style={{ fontSize: 14, margin: '4px 0', color: 'var(--neutral-800)' }}>{match.awayClubName}</div>
              <label className="form-label" style={{ textAlign: 'center', marginTop: 6, fontSize: 11 }}>Skor Babak Pertama (HT)</label>
              <input 
                type="number" 
                min={0} 
                className="form-input" 
                style={{ width: 85, fontSize: 18, textAlign: 'center', margin: '0 auto' }} 
                value={halfTimeAwayScore} 
                onChange={(e) => setHalfTimeAwayScore(e.target.value === '' ? '' : Number(e.target.value))} 
              />
            </div>
          </div>

          {/* Full Time score toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 14 }}>
            <label className="flex align-center gap-8 semibold cursor-pointer" style={{ fontSize: 13, userSelect: 'none', color: 'var(--neutral-800)' }}>
              <input 
                type="checkbox" 
                checked={showFullTime} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowFullTime(checked);
                  if (checked) {
                    setMatchStatus('Finished');
                    setGraphicType('FT');
                    if (homeScore === 0 || homeScore === '') {
                      setHomeScore(halfTimeHomeScore !== '' ? halfTimeHomeScore : 0);
                    }
                    if (awayScore === 0 || awayScore === '') {
                      setAwayScore(halfTimeAwayScore !== '' ? halfTimeAwayScore : 0);
                    }
                  } else {
                    setMatchStatus('Live');
                    setGraphicType('HT');
                    setHomeScore(0);
                    setAwayScore(0);
                  }
                }} 
              />
              Pertandingan Selesai? Masukkan Skor Akhir (Full Time)
            </label>
          </div>

          {/* Full Time score inputs */}
          {showFullTime && (
            <div className="flex align-center justify-between" style={{ padding: '14px 0', backgroundColor: 'var(--neutral-50)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <label className="form-label" style={{ textAlign: 'center', fontSize: 11 }}>Skor Akhir Home (FT)</label>
                <input 
                  type="number" 
                  min={0} 
                  className="form-input" 
                  style={{ width: 85, fontSize: 22, textAlign: 'center', fontWeight: 'bold', margin: '0 auto' }} 
                  value={homeScore} 
                  onChange={(e) => setHomeScore(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-300)' }}>FT</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <label className="form-label" style={{ textAlign: 'center', fontSize: 11 }}>Skor Akhir Away (FT)</label>
                <input 
                  type="number" 
                  min={0} 
                  className="form-input" 
                  style={{ width: 85, fontSize: 22, textAlign: 'center', fontWeight: 'bold', margin: '0 auto' }} 
                  value={awayScore} 
                  onChange={(e) => setAwayScore(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <label className="form-label">Status Pertandingan</label>
            <select 
              className="form-select" 
              value={matchStatus} 
              onChange={(e: any) => {
                const val = e.target.value;
                setMatchStatus(val);
                if (val === 'Finished') {
                  setShowFullTime(true);
                  setGraphicType('FT');
                  if (homeScore === 0 || homeScore === '') {
                    setHomeScore(halfTimeHomeScore !== '' ? halfTimeHomeScore : 0);
                  }
                  if (awayScore === 0 || awayScore === '') {
                    setAwayScore(halfTimeAwayScore !== '' ? halfTimeAwayScore : 0);
                  }
                } else {
                  setShowFullTime(false);
                  setGraphicType('HT');
                  setHomeScore(0);
                  setAwayScore(0);
                }
              }}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Live">Live (Dalam Pertandingan)</option>
              <option value="Finished">Finished (Selesai)</option>
              <option value="Postponed">Postponed (Ditunda)</option>
              <option value="Cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </div>

        </div>

        {/* Right Side: Timeline event input */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Timeline Gol / Kartu</h3>

          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
            <span className="semibold" style={{ fontSize: 12, display: 'block', marginBottom: 12, color: 'var(--neutral-800)' }}>Tambah Kejadian Pertandingan</span>

            <div className="grid-12" style={{ gap: 12 }}>
              <div style={{ gridColumn: 'span 4' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Menit</label>
                <input type="number" className="form-input" value={newEventMinute} onChange={(e) => setNewEventMinute(Number(e.target.value))} />
              </div>
              <div style={{ gridColumn: 'span 8' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Jenis Kejadian</label>
                <select className="form-select" value={newEventType} onChange={(e: any) => setNewEventType(e.target.value)}>
                  <option value="goal">⚽ Gol</option>
                  <option value="yellow_card">🟨 Kartu Kuning</option>
                  <option value="red_card">🟥 Kartu Merah</option>
                  <option value="substitution">🔄 Pergantian Pemain</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 12' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Klub Asal</label>
                <select 
                  className="form-select" 
                  value={newEventClub} 
                  onChange={(e) => {
                    setNewEventClub(e.target.value);
                    setNewEventPlayer('');
                    setNewEventPlayerSearch('');
                    setIsEventPlayerSelectOpen(false);
                  }}
                >
                  <option value={match.homeClubId}>{match.homeClubName}</option>
                  <option value={match.awayClubId}>{match.awayClubName}</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 12' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Nama Pemain</label>
                <div style={{ position: 'relative' }}>
                  <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
                    <Search size={13} className="search-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ketik nama / nomor pemain..."
                      value={newEventPlayerSearch}
                      onFocus={() => setIsEventPlayerSelectOpen(true)}
                      onBlur={() => setTimeout(() => setIsEventPlayerSelectOpen(false), 120)}
                      onChange={(e) => {
                        setNewEventPlayerSearch(e.target.value);
                        setNewEventPlayer('');
                        setIsEventPlayerSelectOpen(true);
                      }}
                      style={{ height: 40, fontSize: 12 }}
                    />
                  </div>
                  {isEventPlayerSelectOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 'calc(100% + 4px)',
                        zIndex: 60,
                        backgroundColor: 'white',
                        border: '1px solid var(--neutral-200)',
                        borderRadius: 8,
                        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
                        maxHeight: 210,
                        overflowY: 'auto',
                        padding: 4,
                      }}
                    >
                      {eventPlayerOptions.length === 0 ? (
                        <div className="text-muted" style={{ fontSize: 12, padding: '10px 12px' }}>Pemain tidak ditemukan</div>
                      ) : (
                        eventPlayerOptions.map(player => (
                          <button
                            key={player.id}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setNewEventPlayer(player.name);
                              setNewEventPlayerSearch(`${player.name}${player.number ? ` (#${player.number})` : ''}`);
                              setIsEventPlayerSelectOpen(false);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              border: 'none',
                              background: newEventPlayer === player.name ? 'var(--primary-50)' : 'transparent',
                              color: 'var(--neutral-900)',
                              cursor: 'pointer',
                              padding: '8px 10px',
                              borderRadius: 6,
                              textAlign: 'left',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                            <span className="text-muted" style={{ fontSize: 11, flexShrink: 0 }}>
                              {player.number ? `#${player.number}` : ''}{player.isForeign ? ' Asing' : ''}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button className="btn btn-sm btn-primary w-full" style={{ marginTop: 12 }} onClick={addEvent}>
              Tambahkan Event
            </button>
          </div>

          {/* Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((evt) => (
              <div key={evt.id} className="flex justify-between align-center" style={{ padding: '8px 12px', backgroundColor: 'var(--neutral-50)', borderRadius: 6, fontSize: 13 }}>
                <div className="flex align-center gap-8">
                  <span className="semibold" style={{ color: 'var(--primary-600)' }}>{evt.minute}'</span>
                  <span>{evt.type === 'goal' ? '⚽' : evt.type === 'yellow_card' ? '🟨' : evt.type === 'red_card' ? '🟥' : '🔄'}</span>
                  <span style={{ color: 'var(--neutral-800)' }}>{evt.playerName}</span>
                </div>
                <div className="flex align-center gap-8">
                  <span className="text-muted" style={{ fontSize: 11 }}>{evt.clubId === match.homeClubId ? 'Home' : 'Away'}</span>
                  <button onClick={() => setEvents(prev => prev.filter(x => x.id !== evt.id))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instagram Graphic Export Row */}
      <div className="card" style={{ marginTop: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ alignSelf: 'flex-start', width: '100%' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Instagram Feed Graphic</h3>
          <p className="page-description" style={{ margin: 0 }}>Gunakan template premium ini untuk mempublikasikan hasil pertandingan ke feeds Instagram resmi.</p>
        </div>

        {!isGraphicScoresFilled ? (
          <div style={{
            width: '100%',
            maxWidth: 500,
            padding: '24px 16px',
            backgroundColor: 'var(--neutral-50)',
            border: '1px dashed var(--neutral-300)',
            borderRadius: 12,
            textAlign: 'center',
            color: 'var(--neutral-600)',
            fontSize: 13,
            fontWeight: 500
          }}>
            {effectiveGraphicType === 'FT'
              ? 'Silakan isi skor akhir Full Time (FT) di atas terlebih dahulu untuk mengaktifkan preview dan unduhan Instagram Graphic.'
              : 'Silakan isi skor Half Time (HT) di atas terlebih dahulu untuk mengaktifkan preview dan unduhan Instagram Graphic.'}
          </div>
        ) : (
          <>
            {/* Control Panel */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%', maxWidth: 500, justifyContent: 'center' }}>
              {/* Content Type */}
              <div style={{ flex: '1 1 140px' }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Tipe Konten</label>
                <div style={{ display: 'flex', backgroundColor: 'var(--neutral-100)', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: effectiveGraphicType === 'HT' ? 'var(--primary-600)' : 'transparent',
                      color: effectiveGraphicType === 'HT' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (showFullTime) {
                        triggerToast('Nonaktifkan "Pertandingan Selesai" untuk membuat gambar Half Time.', 'warning');
                        return;
                      }
                      setGraphicType('HT');
                    }}
                  >
                    Half Time
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: effectiveGraphicType === 'FT' ? 'var(--primary-600)' : 'transparent',
                      color: effectiveGraphicType === 'FT' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (!showFullTime) {
                        triggerToast('Aktifkan "Pertandingan Selesai" terlebih dahulu untuk membuat gambar Full Time.', 'warning');
                        return;
                      }
                      setGraphicType('FT');
                    }}
                  >
                    Full Time
                  </button>
                </div>
              </div>

              {/* Ratio Selection */}
              <div style={{ flex: '1 1 140px' }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Rasio Gambar</label>
                <div style={{ display: 'flex', backgroundColor: 'var(--neutral-100)', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: graphicRatio === '1:1' ? 'var(--primary-600)' : 'transparent',
                      color: graphicRatio === '1:1' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setGraphicRatio('1:1')}
                  >
                    1:1 Feed
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: graphicRatio === '4:5' ? 'var(--primary-600)' : 'transparent',
                      color: graphicRatio === '4:5' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setGraphicRatio('4:5')}
                  >
                    4:5 Story
                  </button>
                </div>
              </div>

              {/* Background Image Upload */}
              <div style={{ flex: '1 1 180px' }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Gambar Background</label>
                <div className="flex gap-8 align-center" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '6px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>📁</span> {backgroundImage ? 'Ganti Bg' : 'Pilih Gambar'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setPendingBackgroundImage(event.target.result as string);
                              setPendingBackgroundPositionX(backgroundPositionX);
                              setPendingBackgroundPositionY(backgroundPositionY);
                              setPendingBackgroundZoom(backgroundZoom);
                              setPendingBackgroundDim(backgroundDim);
                              triggerToast('Gambar siap diatur. Klik Terapkan jika sudah pas.');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {backgroundImage && !pendingBackgroundImage && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => {
                        setPendingBackgroundImage(backgroundImage);
                        setPendingBackgroundPositionX(backgroundPositionX);
                        setPendingBackgroundPositionY(backgroundPositionY);
                        setPendingBackgroundZoom(backgroundZoom);
                        setPendingBackgroundDim(backgroundDim);
                      }}
                    >
                      <span>⚙️</span> Atur Posisi
                    </button>
                  )}
                  {backgroundImage && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => {
                        setBackgroundImage(null);
                        resetBackgroundImageDraft();
                        triggerToast('Gambar background dihapus.');
                      }}
                    >
                      <span>🗑️</span> Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {pendingBackgroundImage && (
              <div style={{ width: '100%', maxWidth: 500, border: '1px solid var(--neutral-200)', borderRadius: 8, padding: 12, backgroundColor: 'var(--neutral-50)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>Preview & Atur Background</label>
                  <div className="flex gap-8">
                    <button type="button" className="btn btn-sm btn-primary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={applyPendingBackgroundImage}>
                      Terapkan
                    </button>
                    <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={resetBackgroundImageDraft}>
                      Batal
                    </button>
                  </div>
                </div>
                <div style={{ position: 'relative', height: 180, overflow: 'hidden', borderRadius: 8, backgroundColor: '#111', marginBottom: 12 }}>
                  <img
                    src={pendingBackgroundImage}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `${pendingBackgroundPositionX}% ${pendingBackgroundPositionY}%`,
                      transform: `scale(${pendingBackgroundZoom / 100})`,
                      transformOrigin: `${pendingBackgroundPositionX}% ${pendingBackgroundPositionY}%`,
                    }}
                  />
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0, 0, 0, ${pendingBackgroundDim / 100})`, pointerEvents: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="form-label" style={{ fontSize: 11, margin: 0 }}>
                    Posisi X
                    <input type="range" className="w-full" min="0" max="100" value={pendingBackgroundPositionX} onChange={(e) => setPendingBackgroundPositionX(Number(e.target.value))} />
                  </label>
                  <label className="form-label" style={{ fontSize: 11, margin: 0 }}>
                    Posisi Y
                    <input type="range" className="w-full" min="0" max="100" value={pendingBackgroundPositionY} onChange={(e) => setPendingBackgroundPositionY(Number(e.target.value))} />
                  </label>
                  <label className="form-label" style={{ fontSize: 11, margin: 0 }}>
                    Zoom
                    <input type="range" className="w-full" min="100" max="180" value={pendingBackgroundZoom} onChange={(e) => setPendingBackgroundZoom(Number(e.target.value))} />
                  </label>
                  <label className="form-label" style={{ fontSize: 11, margin: 0 }}>
                    Gelap Overlay
                    <input type="range" className="w-full" min="0" max="55" value={pendingBackgroundDim} onChange={(e) => setPendingBackgroundDim(Number(e.target.value))} />
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-12" style={{ width: '100%', maxWidth: 500 }}>
              <button
                className="btn btn-md btn-primary flex-1 flex align-center justify-center gap-8"
                style={{ padding: '10px 24px', fontWeight: 600, letterSpacing: 0.5 }}
                onClick={shareResultGraphic}
                disabled={isExportingGraphic}
              >
                <Share2 size={16} /> Bagikan Gambar ({effectiveGraphicType === 'HT' ? 'Halftime' : 'Fulltime'})
              </button>
              <button
                className="btn btn-md btn-secondary flex-1 flex align-center justify-center gap-8"
                style={{ padding: '10px 24px', fontWeight: 600, letterSpacing: 0.5 }}
                onClick={downloadResultGraphic}
                disabled={isExportingGraphic}
              >
                <Download size={16} /> Unduh PNG ({graphicRatio})
              </button>
            </div>

            {/* IG Feed Graphic Canvas */}
            <div 
              id="match-feed-card"
              style={{
                width: 400,
                height: graphicRatio === '1:1' ? 400 : 500,
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 16,
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                fontFamily: 'Inter, system-ui, sans-serif',
                overflow: 'hidden'
              }}
            >
              {currentShowImage && (
                <>
                  <img
                    src={currentShowImage}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `${currentShowPositionX}% ${currentShowPositionY}%`,
                      transform: `scale(${currentShowZoom / 100})`,
                      transformOrigin: `${currentShowPositionX}% ${currentShowPositionY}%`,
                      zIndex: 0,
                    }}
                  />
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
                      background: `linear-gradient(rgba(10, 10, 10, ${Math.max(currentShowDim - 12, 0) / 100}) 0%, rgba(10, 10, 10, ${currentShowDim / 100}) 45%, rgba(10, 10, 10, ${Math.min(currentShowDim + 45, 85) / 100}) 90%)`,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  />
                </>
              )}

              {!currentShowImage && (
                <>
                  <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
                  <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
                </>
              )}

              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', zIndex: 3 }} />

              {/* Header */}
              <div style={{ 
                zIndex: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: 'transparent', 
                padding: '8px 0',
                marginTop: 4
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
                  <span style={{ fontSize: 8, fontWeight: 800, backgroundColor: '#c8a84b', color: '#0a0a0a', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {effectiveGraphicType === 'HT' ? 'HALF TIME' : 'FULL TIME'}
                  </span>
                  <img src={appSettings.appLogoSrc} alt={appSettings.appName} style={{ height: 22, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
                </div>
              </div>

              <div style={{ flex: 1 }} />

              {/* Bottom Card Panel */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' }}>{scoreHomeToShow}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#e2e8f0', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>-</span>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' }}>{scoreAwayToShow}</span>
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
                  {effectiveGraphicType === 'FT' && shouldShowHalfTimeInFullTimeGraphic
                    ? `HALF TIME: ${halfTimeHomeScore} - ${halfTimeAwayScore}`
                    : (match.venue || 'Stadion Pertandingan')}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, width: '100%', fontSize: 9 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {events
                      .filter(e => e.type === 'goal' && String(e.clubId) === String(match.homeClubId) && (effectiveGraphicType === 'FT' || e.minute <= 45))
                      .map((evt, index) => (
                        <div key={evt.id || `home-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                          <span style={{ color: '#c8a84b', fontWeight: 700 }}>{evt.minute}'</span>
                          <span>⚽ {evt.playerName}</span>
                        </div>
                      ))}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                    {events
                      .filter(e => e.type === 'goal' && String(e.clubId) === String(match.awayClubId) && (effectiveGraphicType === 'FT' || e.minute <= 45))
                      .map((evt, index) => (
                        <div key={evt.id || `away-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', flexDirection: 'row-reverse', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                          <span style={{ color: '#c8a84b', fontWeight: 700 }}>{evt.minute}'</span>
                          <span>{evt.playerName} ⚽</span>
                        </div>
                      ))}
                  </div>
                </div>
                {events.filter(e => e.type === 'goal' && (effectiveGraphicType === 'FT' || e.minute <= 45)).length === 0 && (
                  <div style={{ fontSize: 9, color: '#a0aec0', textAlign: 'center', fontStyle: 'italic', padding: '2px 0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>Tidak ada gol tercipta</div>
                )}
              </div>

              {/* Footer */}
              <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 6, fontSize: 8, color: '#a0aec0', fontWeight: 600, marginTop: 8, width: '100%', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                <span>{appSettings.appHandle}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Safety Rules Reason Dialog Modal */}
      {showReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--danger-600)' }}>Konfirmasi Perubahan Skor Published</h3>
            <p style={{ fontSize: 13, color: 'var(--neutral-700)', marginBottom: 16 }}>
              Hasil pertandingan ini sebelumnya telah dipublikasikan. Mengubah skor akhir akan mencatat audit trail khusus.
            </p>
            <div className="form-group">
              <label className="form-label">Alasan Perubahan Skor <span className="required">*</span></label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Contoh: Kesalahan input skor oleh petugas lapangan iLeague."
                value={safetyReason}
                onChange={(e) => setSafetyReason(e.target.value)}
              />
            </div>
            <div className="flex gap-12 justify-between" style={{ marginTop: 16 }}>
              <button className="btn btn-md btn-secondary" onClick={() => setShowReasonModal(false)}>Batal</button>
              <LoadingButton className="btn btn-md btn-danger" disabled={!safetyReason} loading={isSaving} loadingLabel="Menyimpan..." onClick={() => {
                setShowReasonModal(false);
                submitUpdate();
              }}>
                Konfirmasi Perubahan
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
