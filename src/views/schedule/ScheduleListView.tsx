'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Match, Player, Competition } from '@/lib/mockData';
import {
  Search,
  Plus,
  Calendar,
  FileText,
  Trophy,
  Edit,
  Trash2,
  ChevronRight,
  Share2,
  Download,
  X
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import PublishedLineupStoryCard from './PublishedLineupStoryCard';
import {
  getEffectiveMatchStatus,
  getEffectiveLineupStatus,
  hasSavedLineupSelection,
  hasPublishedLineupSnapshot,
  renderPublishedStoryFlag,
  APP_NAME,
  APP_HANDLE,
  APP_LOGO_SRC
} from '@/logic/utils';
import { apiRequest } from '@/logic/apiClient';
import LoadingButton from '@/views/shared/LoadingButton';

export default function ScheduleListView() {
  const router = useRouter();
  const {
    matches,
    setMatches,
    players,
    competitions,
    hasPermission,
    logAction,
    triggerToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComp, setSelectedComp] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewMatch, setPreviewMatch] = useState<Match | null>(null);
  const [isExportingPublishedStory, setIsExportingPublishedStory] = useState(false);

  const filtered = matches.filter(m => {
    const name = (m.homeClubName + ' vs ' + m.awayClubName).toLowerCase();
    const ms = searchTerm.toLowerCase();
    const matchSearch = name.includes(ms) || m.venue.toLowerCase().includes(ms);
    const matchComp   = selectedComp === 'Semua' || m.competition === selectedComp;
    const matchStatus = selectedStatus === 'Semua' || getEffectiveMatchStatus(m) === selectedStatus;
    return matchSearch && matchComp && matchStatus;
  }).sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

  const upcoming = filtered.filter(m => ['Scheduled','Live','Postponed'].includes(getEffectiveMatchStatus(m)));
  const played   = filtered.filter(m => ['Finished','Cancelled'].includes(getEffectiveMatchStatus(m)));
  const scheduledCount = matches.filter(m => getEffectiveMatchStatus(m) === 'Scheduled').length;
  const lineupReadyCount = matches.filter(m => getEffectiveLineupStatus(m) === 'Complete').length;
  const resultReadyCount = matches.filter(m => getEffectiveLineupStatus(m) === 'Complete' && ['Live','Finished'].includes(getEffectiveMatchStatus(m))).length;
  const competitionBuckets = competitions
    .map(comp => ({ comp, count: matches.filter(m => m.competition === comp.name).length }))
    .filter(item => item.count > 0 || item.comp.isActive);

  const statusLabel = (s: string) => ({ Scheduled: 'Dijadwalkan', Live: 'Live', Finished: 'Selesai', Postponed: 'Ditunda', Cancelled: 'Dibatalkan' }[s] || s);
  const statusClass = (s: string) => ({ Scheduled: 'badge-info', Live: 'badge-danger', Finished: 'badge-success', Postponed: 'badge-warning', Cancelled: 'badge-draft' }[s] || 'badge-info');
  const lineupClass = (s: string) => s === 'Complete' ? 'badge-success' : s === 'Needs Review' ? 'badge-warning' : 'badge-draft';
  const lineupLabel = (s: string) => s === 'Complete' ? 'Siap' : s === 'Needs Review' ? 'Review' : 'Belum';
  const getPublishedStoryElementId = (matchId: string) => `published-lineup-story-card-${matchId}`;
  const getPublishedStoryFileName = (match: Match) => `Lineup_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`.replace(/[^\w.-]+/g, '_');

  const createPublishedLineupStoryImage = async (match: Match) => {
    const node = document.getElementById(getPublishedStoryElementId(match.id));
    if (!node) throw new Error('Gambar lineup belum siap.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob, fileName: getPublishedStoryFileName(match) };
  };

  const downloadPublishedLineupStory = async (match: Match) => {
    try {
      setIsExportingPublishedStory(true);
      triggerToast('Membuat gambar...');
      const { dataUrl, fileName } = await createPublishedLineupStoryImage(match);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Story berhasil diunduh!');
    } catch (err) {
      console.warn('Published lineup download failed:', err);
      triggerToast('Gagal mengunduh story.', 'error');
    } finally {
      setIsExportingPublishedStory(false);
    }
  };

  const sharePublishedLineupStory = async (match: Match) => {
    try {
      setIsExportingPublishedStory(true);
      triggerToast('Membuat gambar...');
      const { blob, dataUrl, fileName } = await createPublishedLineupStoryImage(match);
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: `${match.homeClubName} vs ${match.awayClubName}`,
        text: 'Lineup Gosball',
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Story siap dibagikan.');
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
        console.warn('Published lineup share failed:', err);
        triggerToast('Gagal membagikan story.', 'error');
      }
    } finally {
      setIsExportingPublishedStory(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    try {
      setDeletingId(id);
      const result = await apiRequest(`/api/matches?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!result.success) {
        triggerToast(`Gagal menghapus jadwal: ${result.error}`, 'error');
        return;
      }
      setMatches(prev => prev.filter(m => m.id !== id));
      logAction('DELETE_SCHEDULE', 'Jadwal Pertandingan', `Menghapus jadwal match id: ${id}`);
      triggerToast('Jadwal berhasil dihapus!');
      setConfirmDeleteId(null);
    } catch (err: any) {
      triggerToast('Terjadi kesalahan saat menghapus jadwal.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const renderRow = (m: Match) => {
    const isToday = new Date(m.kickoff).toDateString() === new Date().toDateString();
    const effectiveStatus = getEffectiveMatchStatus(m);
    const effectiveLineupStatus = getEffectiveLineupStatus(m);
    const canResult = effectiveStatus === 'Live' && effectiveLineupStatus === 'Complete';
    const hasLineupData = hasSavedLineupSelection(m);
    const canOpenPublishedLineup = hasPublishedLineupSnapshot(m);
    const canLineup = ['Scheduled','Live'].includes(effectiveStatus) || canOpenPublishedLineup;
    const handleLineupAction = () => {
      if (canOpenPublishedLineup) {
        setPreviewMatch(m);
        return;
      }

      if (m.publicationStatus === 'Published' && !hasLineupData) {
        triggerToast('Lineup lama belum punya detail tersimpan. Buka editor untuk simpan ulang lineup.', 'warning');
      }
      router.push(`/lineups?edit=${m.id}`);
    };
    return (
      <tr key={m.id} style={{ backgroundColor: isToday ? 'var(--primary-50)' : undefined }}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {m.homeLogo && m.homeLogo.startsWith('http')
              ? <img src={m.homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <span style={{ fontSize: 18 }}>{m.homeLogo}</span>}
            <span className="semibold" style={{ fontSize: 13 }}>{m.homeClubName}</span>
            <span className="text-muted" style={{ fontSize: 11 }}>vs</span>
            {m.awayLogo && m.awayLogo.startsWith('http')
              ? <img src={m.awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <span style={{ fontSize: 18 }}>{m.awayLogo}</span>}
            <span className="semibold" style={{ fontSize: 13 }}>{m.awayClubName}</span>
            {isToday && <span style={{ fontSize: 10, background: 'var(--primary-600)', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>HARI INI</span>}
          </div>
          <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{m.venue}</div>
        </td>
        <td style={{ fontSize: 12 }}>{m.competition}</td>
        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <div>{new Date(m.kickoff).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
          <div className="text-muted" style={{ fontSize: 11 }}>{new Date(m.kickoff).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
        </td>
        <td><span className={`badge ${statusClass(effectiveStatus)}`}>{statusLabel(effectiveStatus)}</span></td>
        <td><span className={`badge ${lineupClass(effectiveLineupStatus)}`}>{lineupLabel(effectiveLineupStatus)}</span></td>
        <td>
          {m.halfTimeHomeScore !== undefined && m.halfTimeHomeScore !== null && m.halfTimeAwayScore !== undefined && m.halfTimeAwayScore !== null ? (
            <span className="semibold" style={{ fontSize: 12 }}>{m.halfTimeHomeScore} - {m.halfTimeAwayScore}</span>
          ) : (
            <span className="text-muted" style={{ fontSize: 12 }}>-</span>
          )}
        </td>
        <td>
          {m.homeScore !== undefined && m.homeScore !== null && m.awayScore !== undefined && m.awayScore !== null ? (
            <span style={{ fontSize: 13, fontWeight: 700 }}>{m.homeScore} - {m.awayScore}</span>
          ) : (
            <span className="text-muted" style={{ fontSize: 12 }}>-</span>
          )}
        </td>
        <td className="text-right">
          <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canLineup && hasPermission('Lineup Pertandingan', 'create_edit') && (
              <button className="btn btn-sm btn-primary" onClick={handleLineupAction} style={{ fontSize: 11 }}>
                {canOpenPublishedLineup ? 'Lihat Lineup' : hasLineupData ? 'Edit Lineup' : 'Buat Lineup'}
              </button>
            )}
            {effectiveStatus === 'Live' && hasPermission('Match Result', 'create_edit') && (
              <button className="btn btn-sm btn-secondary" disabled={!canResult} title={canResult ? 'Input hasil pertandingan' : 'Lengkapi lineup dulu'} onClick={() => router.push(`/results?edit=${m.id}`)} style={{ fontSize: 11 }}>Hasil</button>
            )}
            <button className="btn btn-sm btn-secondary" onClick={() => router.push(`/schedule?edit=${m.id}`)} style={{ fontSize: 11 }}><Edit size={12} /></button>
            {hasPermission('Lineup Pertandingan', 'delete') && (
              confirmDeleteId === m.id ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                  <LoadingButton className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={() => handleDelete(m.id)} loading={deletingId === m.id} loadingLabel="Menghapus...">Ya</LoadingButton>
                  <button className="btn btn-sm btn-secondary" disabled={deletingId === m.id} style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(null)}>Batal</button>
                </span>
              ) : (
                <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(m.id)}><Trash2 size={12} /></button>
              )
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderTable = (rows: Match[], title: string) => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>
        {title} ({rows.length})
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pertandingan</th>
              <th>Kompetisi</th>
              <th>Kickoff</th>
              <th>Status</th>
              <th>Lineup</th>
              <th>HT</th>
              <th>FT</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Jadwal Pertandingan</span></div>
          <h1 className="page-title">Jadwal Pertandingan</h1>
          <p className="page-description">Kelola jadwal semua kompetisi sebagai pintu awal flow: jadwal, lineup hari H, lalu hasil HT/FT.</p>
        </div>
        {hasPermission('Lineup Pertandingan', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={() => router.push('/schedule?edit=new')}><Plus size={16} /> Tambah Jadwal</button>
        )}
      </div>

      <div className="schedule-flow-grid">
        <div className="schedule-flow-card">
          <Calendar size={18} />
          <div>
            <span>Jadwal dibuat</span>
            <strong>{scheduledCount}</strong>
          </div>
        </div>
        <div className="schedule-flow-card">
          <FileText size={18} />
          <div>
            <span>Lineup siap</span>
            <strong>{lineupReadyCount}</strong>
          </div>
        </div>
        <div className="schedule-flow-card">
          <Trophy size={18} />
          <div>
            <span>Siap hasil HT/FT</span>
            <strong>{resultReadyCount}</strong>
          </div>
        </div>
      </div>

      <div className="competition-schedule-strip">
        {competitionBuckets.map(({ comp, count }) => (
          <button
            key={comp.id}
            type="button"
            className={`competition-schedule-pill ${selectedComp === comp.name ? 'active' : ''}`}
            onClick={() => setSelectedComp(selectedComp === comp.name ? 'Semua' : comp.name)}
          >
            <span>{comp.shortName || comp.name}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ maxWidth: 260, flex: 1 }}>
          <Search size={14} className="search-icon" />
          <input type="text" className="form-input" placeholder="Cari klub atau stadion..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-select" style={{ maxWidth: 220 }} value={selectedComp} onChange={e => setSelectedComp(e.target.value)}>
          <option value="Semua">Semua Kompetisi</option>
          {competitions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
          <option value="Semua">Semua Status</option>
          <option value="Scheduled">Dijadwalkan</option>
          <option value="Live">Live</option>
          <option value="Finished">Selesai</option>
          <option value="Postponed">Ditunda</option>
          <option value="Cancelled">Dibatalkan</option>
        </select>
        {(searchTerm || selectedComp !== 'Semua' || selectedStatus !== 'Semua') && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setSelectedComp('Semua'); setSelectedStatus('Semua'); }}>Reset</button>
        )}
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{filtered.length} pertandingan</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Calendar size={36} color="var(--neutral-400)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Belum ada jadwal</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Tambahkan jadwal pertandingan untuk semua kompetisi.</p>
          {hasPermission('Lineup Pertandingan', 'create_edit') && (
            <button className="btn btn-sm btn-primary" onClick={() => router.push('/schedule?edit=new')}>Tambah Jadwal</button>
          )}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && renderTable(upcoming, 'Mendatang')}
          {played.length > 0 && renderTable(played, 'Sudah Berlangsung')}
        </>
      )}

      {previewMatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
          onClick={() => setPreviewMatch(null)}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxHeight: '95vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-md btn-primary" onClick={() => sharePublishedLineupStory(previewMatch)} disabled={isExportingPublishedStory}>
                <Share2 size={14} /> Bagikan Story
              </button>
              <button className="btn btn-md btn-secondary" onClick={() => downloadPublishedLineupStory(previewMatch)} disabled={isExportingPublishedStory}>
                <Download size={14} /> Unduh PNG
              </button>
              <button className="btn btn-md btn-secondary" onClick={() => setPreviewMatch(null)}>
                <X size={14} /> Tutup
              </button>
            </div>
            <PublishedLineupStoryCard
              match={previewMatch}
              players={players}
              competitions={competitions}
              elementId={getPublishedStoryElementId(previewMatch.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
