'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  APP_NAME,
  getEffectiveLineupStatus,
  getEffectiveMatchStatus
} from '@/logic/utils';

export default function DashboardView() {
  const router = useRouter();
  const { matches, rumors, clubs, players, auditLogs } = useApp();

  // KPI Calculations
  const totalMatchesToday = matches.filter(m => getEffectiveMatchStatus(m) === 'Live').length;
  const incompleteLineups = matches.filter(m => getEffectiveLineupStatus(m) !== 'Complete').length;
  const resultsPendingReview = matches.filter(m => {
    const effectiveStatus = getEffectiveMatchStatus(m);
    return effectiveStatus !== 'Finished' && (effectiveStatus === 'Live' || getEffectiveLineupStatus(m) === 'Needs Review');
  }).length;
  const activeRumors = rumors.length;

  // Data quality warning count
  const dataQualityWarnings = [
    players.filter(p => !p.flagUrl).length > 0 && "Ada pemain tanpa info negara",
    clubs.filter(c => !c.logoUrl).length > 0 && "Klub tanpa logo",
    players.filter(p => p.completeness < 80).length > 0 && "Ada data pemain dengan kelengkapan < 80%"
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page Title */}
      <div>
        <h1 className="page-title">{APP_NAME}</h1>
        <p className="page-description">Ringkasan operasional media olahraga hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Row 1 — KPI Cards */}
      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Pertandingan Hari Ini</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{totalMatchesToday}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => router.push('/lineups')}>
            Lihat Agenda <ChevronRight size={12} />
          </button>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Lineup Belum Lengkap</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, color: incompleteLineups > 0 ? 'var(--warning-600)' : 'inherit' }}>{incompleteLineups}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => router.push('/lineups')}>
            Lengkapi Sekarang <ChevronRight size={12} />
          </button>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Hasil Perlu Review</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, color: resultsPendingReview > 0 ? 'var(--warning-600)' : 'inherit' }}>{resultsPendingReview}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => router.push('/results')}>
            Review Hasil <ChevronRight size={12} />
          </button>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Rumor Aktif</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{activeRumors}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => router.push('/rumors')}>
            Lihat Rumor <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Row 2 — Agenda & Editor task panel */}
      <div className="grid-12">
        {/* Agenda Pertandingan */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Jadwal Pertandingan Terdekat</h3>
            <span className="badge badge-info">Liga Nusantara Utama 2026/27</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Kickoff / Venue</th>
                  <th>Lineup</th>
                  <th>Publikasi</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(match => {
                  const effectiveLineupStatus = getEffectiveLineupStatus(match);
                  return (
                    <tr key={match.id}>
                      <td>
                        <div className="flex align-center gap-12">
                          <span style={{ fontSize: 20 }}>{match.homeLogo}</span>
                          <span className="semibold" style={{ fontSize: 13 }}>{match.homeClubName}</span>
                          <span className="text-muted">vs</span>
                          <span style={{ fontSize: 20 }}>{match.awayLogo}</span>
                          <span className="semibold" style={{ fontSize: 13 }}>{match.awayClubName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{new Date(match.kickoff).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{match.venue}</div>
                      </td>
                      <td>
                        <span className={`badge ${effectiveLineupStatus === 'Complete' ? 'badge-success' : effectiveLineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft'}`}>
                          {effectiveLineupStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                          {match.publicationStatus}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button className="btn btn-sm btn-secondary" title="Kelola Lineup" onClick={() => router.push(`/lineups?edit=${match.id}`)}>
                            Lineup
                          </button>
                          <button className="btn btn-sm btn-primary" title="Input Hasil" onClick={() => router.push(`/results?edit=${match.id}`)}>
                            Hasil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editorial Tasks */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Tugas Editorial Saya</h3>
          <div className="flex flex-col gap-12" style={{ flex: 1 }}>
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: 3 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Tinjau rumor Transfer Ardi Pratama</div>
                <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2 }}>Minta konfirmasi agen pemain atau ofisial Cakra FC.</div>
                <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 6px', marginTop: 6 }}>Review Editorial</span>
              </div>
            </div>

            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: 3 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Update lineup Jakarta Garuda FC</div>
                <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2 }}>Kickoff besok 19.30. Starting lineup harus terisi min 11 pemain.</div>
                <span className="badge badge-danger" style={{ fontSize: 10, padding: '2px 6px', marginTop: 6 }}>Hari Ini</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Quality Warnings & Audit Trail */}
      <div className="grid-12">
        {/* Data Quality */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Peringatan Kualitas Data</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dataQualityWarnings.length > 0 ? (
              dataQualityWarnings.map((warn, index) => (
                <div key={index} style={{ padding: 12, backgroundColor: '#FEF3C7', borderLeft: '4px solid var(--warning-600)', borderRadius: 4, fontSize: 12, color: '#92400E', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} /> {warn}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--neutral-500)', fontSize: 13 }}>
                <CheckCircle size={24} color="var(--success-600)" style={{ margin: '0 auto 8px', display: 'block' }} />
                Semua data tersimpan bersih dan lengkap.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Aktivitas Sistem Terkini</h3>
            <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }} onClick={() => router.push('/logs')}>
              Semua Log
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {auditLogs.slice(0, 3).map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid var(--neutral-100)', paddingBottom: 10, fontSize: 12 }}>
                <div className="flex justify-between align-center" style={{ marginBottom: 4 }}>
                  <span className="semibold" style={{ color: 'var(--neutral-700)' }}>{log.user}</span>
                  <span className="text-muted" style={{ fontSize: 10 }}>{log.timestamp}</span>
                </div>
                <div style={{ color: 'var(--neutral-900)' }}>
                  <span className="badge badge-info" style={{ fontSize: 9, padding: '2px 6px', marginRight: 6 }}>{log.module}</span>
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
