'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import {
  Calendar,
  Users,
  Trophy,
  Flame,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Activity
} from 'lucide-react';
import {
  getEffectiveLineupStatus,
  getEffectiveMatchStatus,
  hasSavedHalfTimeResult,
  hasHalfTimeScoreValues
} from '@/logic/utils';
import { Rumor } from '@/lib/mockData';

export default function DashboardView() {
  const router = useRouter();
  const { appSettings, matches, rumors, clubs, players, auditLogs } = useApp();

  const [matchFilter, setMatchFilter] = useState<'all' | 'needs_action' | 'finished'>('all');

  // KPI Calculations across 4 modules
  const totalMatchesToday = matches.filter(m => {
    const s = getEffectiveMatchStatus(m);
    return s === 'Live' || s === 'Scheduled';
  }).length;

  const incompleteLineups = matches.filter(m => getEffectiveLineupStatus(m) !== 'Complete').length;

  const resultsPendingReview = matches.filter(m => {
    const effectiveStatus = getEffectiveMatchStatus(m);
    return (effectiveStatus === 'Finished' && m.publicationStatus !== 'Published') ||
      (effectiveStatus === 'Live' && !hasSavedHalfTimeResult(m));
  }).length;

  const activeRumorsCount = rumors.length;
  const hotRumorsCount = rumors.filter(r => r.reliabilityTier === 'A' || r.transferStatus === 'Here We Go' || r.probability >= 80).length;
  const draftRumorsCount = rumors.filter(r => r.publicationStatus === 'Draft' || r.publicationStatus === 'Review').length;

  // Filtered matches for the main table widget
  const displayedMatches = matches.filter(m => {
    if (matchFilter === 'needs_action') {
      return getEffectiveLineupStatus(m) !== 'Complete' || m.publicationStatus !== 'Published';
    }
    if (matchFilter === 'finished') {
      return getEffectiveMatchStatus(m) === 'Finished';
    }
    return true;
  });

  // Data Quality Warnings
  const missingFlags = players.filter(p => !p.flagUrl).length;
  const missingLogos = clubs.filter(c => !c.logoUrl).length;
  const incompletePlayers = players.filter(p => p.completeness < 80).length;

  const dataQualityWarnings: string[] = [
    missingFlags > 0 && `${missingFlags} pemain belum memiliki bendera kewarganegaraan.`,
    missingLogos > 0 && `${missingLogos} klub belum memiliki logo resmi.`,
    incompletePlayers > 0 && `${incompletePlayers} profil pemain memiliki kelengkapan data < 80%.`,
  ].filter(Boolean) as string[];

  const rumorTypeBadgeClass = (type: Rumor['type']) => {
    switch (type) {
      case 'resmi': return 'badge-success';
      case 'negosiasi': return 'badge-warning';
      case 'perpanjangan': return 'badge-info';
      case 'loan': return 'badge-secondary';
      default: return 'badge-draft';
    }
  };

  const reliabilityBadgeClass = (tier: Rumor['reliabilityTier']) => {
    switch (tier) {
      case 'A': return 'badge-success';
      case 'B': return 'badge-info';
      case 'C': return 'badge-warning';
      default: return 'badge-danger';
    }
  };

  const renderLogo = (logo: string, fallback: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
      : <span style={{ fontSize: 18 }}>{logo || fallback}</span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Operational Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        padding: '24px 28px',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)'
      }}>
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: 'rgba(34, 197, 94, 0.18)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              padding: '3px 10px',
              borderRadius: 20
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              Executive Control Dashboard
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
            Pusat Operasional {appSettings.appName}
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#cbd5e1', maxWidth: 540 }}>
            Pantau jadwal pertandingan, kesiapan lineup, skor hasil akhir, dan berita rumor transfer terkini secara real-time.
          </p>
        </div>

        {/* Quick Action Button Hub */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-md"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            onClick={() => router.push('/schedule')}
          >
            <Calendar size={15} /> Kelola Jadwal
          </button>
          <button
            className="btn btn-md"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            onClick={() => router.push('/lineups')}
          >
            <Users size={15} /> Cek Lineup
          </button>
          <button
            className="btn btn-md btn-primary"
            onClick={() => router.push('/rumors')}
          >
            <Flame size={15} /> Rumor Transfer ({draftRumorsCount} Pending)
          </button>
        </div>
      </div>

      {/* Row 1 — Executive Module KPIs */}
      <div className="grid-12" style={{ gap: 16 }}>
        {/* KPI 1: Jadwal */}
        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
          <div>
            <div className="flex justify-between align-center" style={{ marginBottom: 8 }}>
              <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                1. Jadwal Pertandingan
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                <Calendar size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--neutral-900)' }}>{totalMatchesToday}</div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>
              Pertandingan aktif / terjadwal
            </div>
          </div>
          <button
            style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '12px 0 0 0', marginTop: 12, borderTop: '1px solid var(--neutral-100)' }}
            onClick={() => router.push('/schedule')}
          >
            Kelola Jadwal <ChevronRight size={13} />
          </button>
        </div>

        {/* KPI 2: Lineup */}
        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
          <div>
            <div className="flex justify-between align-center" style={{ marginBottom: 8 }}>
              <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                2. Status LineUp
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: incompleteLineups > 0 ? '#FEF3C7' : 'var(--success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: incompleteLineups > 0 ? 'var(--warning-600)' : 'var(--success-600)' }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: incompleteLineups > 0 ? 'var(--warning-600)' : 'var(--neutral-900)' }}>
              {incompleteLineups}
            </div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>
              {incompleteLineups > 0 ? 'Lineup belum lengkap / butuh review' : 'Semua lineup sudah siap'}
            </div>
          </div>
          <button
            style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '12px 0 0 0', marginTop: 12, borderTop: '1px solid var(--neutral-100)' }}
            onClick={() => router.push('/lineups')}
          >
            Lengkapi Lineup <ChevronRight size={13} />
          </button>
        </div>

        {/* KPI 3: Hasil Pertandingan */}
        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
          <div>
            <div className="flex justify-between align-center" style={{ marginBottom: 8 }}>
              <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                3. Hasil & Skor
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: resultsPendingReview > 0 ? '#FEE2E2' : 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: resultsPendingReview > 0 ? '#ef4444' : 'var(--primary-600)' }}>
                <Trophy size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: resultsPendingReview > 0 ? '#ef4444' : 'var(--neutral-900)' }}>
              {resultsPendingReview}
            </div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>
              {resultsPendingReview > 0 ? 'Hasil pertandingan pending publikasi' : 'Semua skor hasil dipublikasi'}
            </div>
          </div>
          <button
            style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '12px 0 0 0', marginTop: 12, borderTop: '1px solid var(--neutral-100)' }}
            onClick={() => router.push('/results')}
          >
            Input / Review Skor <ChevronRight size={13} />
          </button>
        </div>

        {/* KPI 4: Rumor Transfer */}
        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
          <div>
            <div className="flex justify-between align-center" style={{ marginBottom: 8 }}>
              <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                4. Rumor & Transfer
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Flame size={16} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--neutral-900)' }}>
              {activeRumorsCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>
              Rumor aktif siap di-edit & di-bagikan
            </div>
          </div>
          <button
            style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '12px 0 0 0', marginTop: 12, borderTop: '1px solid var(--neutral-100)' }}
            onClick={() => router.push('/rumors')}
          >
            Kelola Rumor <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Row 2 — Operational Hub: Modul Pertandingan (Jadwal, Lineup, Hasil) */}
      <div className="grid-12" style={{ gap: 20 }}>
        {/* Main Matches Operational Center */}
        <div className="card" style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Monitor Pertandingan & Lineup</h3>
              <p style={{ fontSize: 12, color: 'var(--neutral-500)', margin: '2px 0 0 0' }}>Jadwal, status formasi pemain, dan skor pertandingan.</p>
            </div>
            <div className="flex gap-8">
              <button
                className={`btn btn-sm ${matchFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => setMatchFilter('all')}
              >
                Semua ({matches.length})
              </button>
              <button
                className={`btn btn-sm ${matchFilter === 'needs_action' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => setMatchFilter('needs_action')}
              >
                Butuh Akses ({matches.filter(m => getEffectiveLineupStatus(m) !== 'Complete' || m.publicationStatus !== 'Published').length})
              </button>
              <button
                className={`btn btn-sm ${matchFilter === 'finished' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => setMatchFilter('finished')}
              >
                Selesai ({matches.filter(m => getEffectiveMatchStatus(m) === 'Finished').length})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
            {displayedMatches.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: 32, fontSize: 13, background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
                Tidak ada pertandingan pada filter ini.
              </div>
            ) : (
              displayedMatches.map(match => {
                const effectiveStatus = getEffectiveMatchStatus(match);
                const lineupStatus = getEffectiveLineupStatus(match);
                const hasHt = hasHalfTimeScoreValues(match);
                const isFt = match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null;

                return (
                  <div
                    key={match.id}
                    style={{
                      background: 'var(--white)',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Header: Competition & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--primary-700)', background: 'var(--primary-50)', padding: '2px 8px', borderRadius: 4 }}>
                          🏆 {match.competition}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--neutral-500)', fontWeight: 500 }}>
                          📅 {new Date(match.kickoff).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${effectiveStatus === 'Finished' ? 'badge-success' : effectiveStatus === 'Live' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: 10 }}>
                          {effectiveStatus === 'Finished' ? 'Selesai' : effectiveStatus === 'Live' ? '● LIVE' : 'Scheduled'}
                        </span>
                        <span className={`badge ${lineupStatus === 'Complete' ? 'badge-success' : lineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft'}`} style={{ fontSize: 10 }}>
                          Lineup: {lineupStatus === 'Complete' ? 'Siap' : lineupStatus === 'Needs Review' ? 'Review' : 'Belum'}
                        </span>
                      </div>
                    </div>

                    {/* Match Center: Home vs Away & Score */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        alignItems: 'center',
                        gap: 12,
                        background: 'var(--neutral-50)',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--neutral-150)',
                      }}
                    >
                      {/* Home Club */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'white', borderRadius: '50%', padding: 2, border: '1px solid var(--neutral-200)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          {renderLogo(match.homeLogo, 'H')}
                        </div>
                        <span className="semibold" style={{ fontSize: 13, color: 'var(--neutral-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {match.homeClubName}
                        </span>
                      </div>

                      {/* Score / VS Center */}
                      <div style={{ textAlign: 'center', padding: '0 8px', minWidth: 80 }}>
                        {isFt ? (
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--neutral-900)', lineHeight: 1 }}>
                              {match.homeScore} - {match.awayScore}
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--neutral-500)', marginTop: 3 }}>FULL TIME</div>
                            {hasHt && (
                              <div style={{ fontSize: 9, color: 'var(--neutral-400)', marginTop: 1 }}>
                                (HT {match.halfTimeHomeScore}-{match.halfTimeAwayScore})
                              </div>
                            )}
                          </div>
                        ) : hasHt ? (
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-600)', lineHeight: 1 }}>
                              HT {match.halfTimeHomeScore} - {match.halfTimeAwayScore}
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary-500)', marginTop: 3 }}>HALF TIME</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: 4, textTransform: 'lowercase' }}>
                            vs
                          </span>
                        )}
                      </div>

                      {/* Away Club */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, minWidth: 0 }}>
                        <span className="semibold" style={{ fontSize: 13, color: 'var(--neutral-900)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {match.awayClubName}
                        </span>
                        <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'white', borderRadius: '50%', padding: 2, border: '1px solid var(--neutral-200)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          {renderLogo(match.awayLogo, 'A')}
                        </div>
                      </div>
                    </div>

                    {/* Footer: Venue & Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                        📍 {match.venue || 'Stadion belum ditentukan'}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          title="Kelola Lineup Pertandingan"
                          onClick={() => router.push(`/lineups?edit=${match.id}`)}
                        >
                          Lineup
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          title="Input Skor & Timeline Hasil"
                          onClick={() => router.push(`/results?edit=${match.id}`)}
                        >
                          Hasil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modul Rumor Transfer Radar */}
        <div className="card" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Radar Rumor & Transfer Hot</h3>
              <p style={{ fontSize: 12, color: 'var(--neutral-500)', margin: '2px 0 0 0' }}>Update transfer terkini & status verifikasi.</p>
            </div>
            <button
              className="btn btn-sm btn-secondary"
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => router.push('/rumors')}
            >
              Lihat Semua
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {rumors.length === 0 ? (
              <div className="text-muted text-center" style={{ padding: 24, fontSize: 12 }}>Belum ada data rumor transfer.</div>
            ) : (
              rumors.slice(0, 4).map(rumor => (
                <div
                  key={rumor.id}
                  style={{
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    backgroundColor: 'var(--white)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div className="flex justify-between align-center">
                    <span style={{
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: '#0a0a0a',
                      backgroundColor: '#c8a84b',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      TRANSFER WATCH
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--neutral-500)', fontWeight: 500 }}>
                      By {rumor.author || 'Rumor Editor'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 42,
                      height: 52,
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: '#0a0a0a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--neutral-200)'
                    }}>
                      {rumor.playerImageUrl ? (
                        <img src={rumor.playerImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Flame size={20} color="#c8a84b" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--neutral-900)', lineHeight: 1.25, marginBottom: 4 }}>
                        {rumor.headline || `${rumor.player} menuju ${rumor.destinationClub}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>{rumor.player || 'Nama Pemain'}</span>
                        <span style={{ color: 'var(--neutral-400)' }}>•</span>
                        <span>{rumor.fromClub || 'Free Agent'} ➔ <strong style={{ color: 'var(--primary-700)' }}>{rumor.destinationClub || 'Klub Tujuan'}</strong></span>
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
                      onClick={() => router.push(`/rumors?edit=${rumor.id}`)}
                    >
                      Detail ➔
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3 — Quality Warnings & System Activity Log */}
      <div className="grid-12" style={{ gap: 20 }}>
        {/* Peringatan Kualitas Data */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="flex align-center gap-8" style={{ marginBottom: 16 }}>
            <ShieldCheck size={18} color="var(--primary-600)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Audit Kualitas Data</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dataQualityWarnings.length > 0 ? (
              dataQualityWarnings.map((warn, index) => (
                <div key={index} style={{ padding: 12, backgroundColor: '#FEF3C7', borderLeft: '4px solid var(--warning-600)', borderRadius: 6, fontSize: 12, color: '#92400E', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{warn}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--neutral-500)', fontSize: 13 }}>
                <CheckCircle2 size={28} color="var(--success-600)" style={{ margin: '0 auto 8px', display: 'block' }} />
                Semua data klub, pemain, dan rumor tersimpan lengkap.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log Aktivitas */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 16 }}>
            <div className="flex align-center gap-8">
              <Activity size={18} color="var(--primary-600)" />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Aktivitas Sistem Terkini</h3>
            </div>
            <button
              style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
              onClick={() => router.push('/logs')}
            >
              Semua Log
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {auditLogs.slice(0, 3).map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid var(--neutral-100)', paddingBottom: 10, fontSize: 12 }}>
                <div className="flex justify-between align-center" style={{ marginBottom: 4 }}>
                  <span className="semibold" style={{ color: 'var(--neutral-800)' }}>{log.user}</span>
                  <span className="text-muted" style={{ fontSize: 10 }}>{log.timestamp}</span>
                </div>
                <div style={{ color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="badge badge-info" style={{ fontSize: 9, padding: '1px 6px' }}>{log.module}</span>
                  <span>{log.details}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
