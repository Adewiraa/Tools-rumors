'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Match } from '@/lib/mockData';
import { Search, ChevronRight, AlertCircle, Edit, Info, X, Share2, Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import PublishedLineupStoryCard from '../schedule/PublishedLineupStoryCard';
import {
  getEffectiveMatchStatus,
  getEffectiveLineupStatus
} from '@/logic/utils';

export default function LineupsListView() {
  const router = useRouter();
  const {
    matches,
    players,
    competitions,
    hasPermission: checkPermission,
    triggerToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComp, setSelectedComp] = useState('Semua');
  const [previewMatch, setPreviewMatch] = useState<Match | null>(null);
  const [isExportingLineupStory, setIsExportingLineupStory] = useState(false);

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

  const filteredMatches = matches.filter(match => {
    const matchName = `${match.homeClubName} vs ${match.awayClubName}`.toLowerCase();
    const matchesSearch = matchName.includes(searchTerm.toLowerCase()) || match.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComp = selectedComp === 'Semua' || match.competition === selectedComp;
    return matchesSearch && matchesComp;
  });

  const getLineupOutputElementId = (matchId: string) => `lineup-output-card-${matchId}`;
  const getLineupOutputFileName = (match: Match) => `Lineup_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`.replace(/[^\w.-]+/g, '_');

  const createLineupOutputImage = async (match: Match) => {
    const node = document.getElementById(getLineupOutputElementId(match.id));
    if (!node) throw new Error('Gambar lineup belum siap.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob, fileName: getLineupOutputFileName(match) };
  };

  const downloadLineupOutput = async (match: Match) => {
    try {
      setIsExportingLineupStory(true);
      triggerToast('Membuat gambar lineup...');
      const { dataUrl, fileName } = await createLineupOutputImage(match);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Lineup berhasil diunduh!');
    } catch (err) {
      console.warn('Lineup output download failed:', err);
      triggerToast('Gagal mengunduh lineup.', 'error');
    } finally {
      setIsExportingLineupStory(false);
    }
  };

  const shareLineupOutput = async (match: Match) => {
    try {
      setIsExportingLineupStory(true);
      triggerToast('Membuat gambar lineup...');
      const { blob, dataUrl, fileName } = await createLineupOutputImage(match);
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: `${match.homeClubName} vs ${match.awayClubName}`,
        text: 'Lineup Gosball',
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Lineup siap dibagikan.');
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
        console.warn('Lineup output share failed:', err);
        triggerToast('Gagal membagikan lineup.', 'error');
      }
    } finally {
      setIsExportingLineupStory(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Lineup Pertandingan</span>
          </div>
          <h1 className="page-title">Lineup Pertandingan</h1>
          <p className="page-description">Kelola susunan pemain, formasi, dan cadangan untuk setiap pertandingan.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
          <div className="search-input-wrapper" style={{ maxWidth: 280 }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Cari klub atau stadion..." className="form-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: 220 }} value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
            <option value="Semua">Semua Kompetisi</option>
            {competitions.filter(c => c.isActive).map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            {competitions.filter(c => !c.isActive).map(c => (
              <option key={c.id} value={c.name}>{c.name} (nonaktif)</option>
            ))}
          </select>
        </div>
        {(searchTerm || selectedComp !== 'Semua') && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setSelectedComp('Semua'); }}>
            Reset Filter
          </button>
        )}
      </div>

      {/* Data Table */}
      {filteredMatches.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Belum ada lineup</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Buat jadwal pertandingan terlebih dahulu, lalu kelola lineup dari ID jadwal tersebut.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertandingan</th>
                <th>Kompetisi</th>
                <th>Kickoff</th>
                <th>Status</th>
                <th>Publikasi</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(match => {
                const effectiveStatus = getEffectiveMatchStatus(match);
                const canViewPublishedLineup = match.publicationStatus === 'Published' || effectiveStatus === 'Finished';
                return (
                  <tr key={match.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {match.homeLogo && match.homeLogo.startsWith('http')
                          ? <img src={match.homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                          : <span style={{ fontSize: 18 }}>{match.homeLogo}</span>}
                        <span className="semibold" style={{ fontSize: 13 }}>{match.homeClubName}</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>vs</span>
                        {match.awayLogo && match.awayLogo.startsWith('http')
                          ? <img src={match.awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                          : <span style={{ fontSize: 18 }}>{match.awayLogo}</span>}
                        <span className="semibold" style={{ fontSize: 13 }}>{match.awayClubName}</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{match.venue}</div>
                      <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>ID Jadwal: {match.id}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{match.competition}</td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(match.kickoff).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
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
                      {canViewPublishedLineup ? (
                        <button className="btn btn-sm btn-secondary" onClick={() => setPreviewMatch(match)}>
                          <Info size={13} /> Lihat Lineup
                        </button>
                      ) : checkPermission('Lineup Pertandingan', 'create_edit') && (
                        <button className="btn btn-sm btn-primary" onClick={() => router.push(`/lineups?edit=${match.id}`)}>
                          <Edit size={13} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {previewMatch && (
        <div className="modal-overlay">
          <div className="modal-content output-preview-modal">
            <div className="output-preview-header">
              <div>
                <h3 className="output-preview-title">Gambar Lineup</h3>
                <div className="output-preview-meta">{previewMatch.homeClubName} vs {previewMatch.awayClubName} - ID Jadwal: {previewMatch.id}</div>
              </div>
              <button className="btn btn-sm btn-secondary" title="Tutup" onClick={() => setPreviewMatch(null)}><X size={16} /></button>
            </div>
            <div className="output-preview-toolbar">
              <button className="btn btn-sm btn-primary" onClick={() => shareLineupOutput(previewMatch)} disabled={isExportingLineupStory}>
                <Share2 size={14} /> Bagikan Lineup
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => downloadLineupOutput(previewMatch)} disabled={isExportingLineupStory}>
                <Download size={14} /> Unduh Lineup
              </button>
            </div>
            <div className="output-preview-stage">
              <PublishedLineupStoryCard
                match={previewMatch}
                players={players}
                competitions={competitions}
                elementId={getLineupOutputElementId(previewMatch.id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
