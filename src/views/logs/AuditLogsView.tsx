'use client';

import React, { useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Search } from 'lucide-react';

// ── Tabel translasi kode aksi → label Indonesia yang ramah ───────────────────
const ACTION_LABEL: Record<string, string> = {
  // Rumor & Transfer
  PUBLISH_RUMOR:         'Publikasi Rumor',
  UPDATE_PUBLISH_RUMOR:  'Perbarui & Publikasi Rumor',
  CREATE_RUMOR:          'Buat Draft Rumor',
  DELETE_RUMOR:          'Hapus Rumor',

  // Jadwal
  CREATE_SCHEDULE:       'Tambah Jadwal Pertandingan',
  UPDATE_SCHEDULE:       'Perbarui Jadwal Pertandingan',
  DELETE_SCHEDULE:       'Hapus Jadwal Pertandingan',

  // Lineup
  PUBLISH_LINEUP:        'Terbitkan Lineup',
  SAVE_LINEUP_DRAFT:     'Simpan Draft Lineup',

  // Hasil Pertandingan
  SAVE_MATCH_RESULT:     'Simpan Skor Pertandingan',
  PUBLISH_MATCH_RESULT:  'Publikasi Hasil Pertandingan',
  SAFETY_TRIGGERED:      'Audit Keamanan Diaktifkan',

  // Master Pemain
  CREATE_PLAYER:         'Tambah Pemain',
  CREATE_PLAYER_FROM_API:'Import Pemain dari API',
  UPDATE_PLAYER:         'Perbarui Data Pemain',
  DELETE_PLAYER:         'Hapus Pemain',

  // Master Klub
  CREATE_CLUB:           'Tambah Klub',
  CREATE_CLUB_FROM_API:  'Import Klub dari API',
  UPDATE_CLUB:           'Perbarui Data Klub',
  DELETE_CLUB:           'Hapus Klub',

  // Master Kompetisi
  CREATE_COMPETITION:    'Tambah Kompetisi',
  UPDATE_COMPETITION:    'Perbarui Kompetisi',
  DELETE_COMPETITION:    'Hapus Kompetisi',
};

// ── Kategori aksi untuk pewarnaan badge ──────────────────────────────────────
type ActionCategory = 'publish' | 'create' | 'update' | 'delete' | 'safety' | 'other';

const getActionCategory = (action: string): ActionCategory => {
  if (action.startsWith('PUBLISH') || action.includes('PUBLISH')) return 'publish';
  if (action.startsWith('DELETE')) return 'delete';
  if (action.startsWith('CREATE') || action.startsWith('IMPORT')) return 'create';
  if (action.startsWith('UPDATE') || action.startsWith('SAVE')) return 'update';
  if (action === 'SAFETY_TRIGGERED') return 'safety';
  return 'other';
};

const CATEGORY_BADGE: Record<ActionCategory, { label: string; bg: string; color: string }> = {
  publish: { label: 'Publikasi', bg: '#dcfce7', color: '#166534' },
  create:  { label: 'Tambah',   bg: '#dbeafe', color: '#1e40af' },
  update:  { label: 'Perbarui', bg: '#fef9c3', color: '#854d0e' },
  delete:  { label: 'Hapus',    bg: '#fee2e2', color: '#991b1b' },
  safety:  { label: 'Keamanan', bg: '#f3e8ff', color: '#6b21a8' },
  other:   { label: 'Sistem',   bg: '#f1f5f9', color: '#475569' },
};

const ROW_HIGHLIGHT: Record<ActionCategory, string | undefined> = {
  delete:  'rgba(239, 68, 68, 0.04)',
  safety:  'rgba(168, 85, 247, 0.04)',
  publish: 'rgba(34, 197, 94, 0.04)',
  create:  undefined,
  update:  undefined,
  other:   undefined,
};

export default function AuditLogsView() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');

  const modules = Array.from(new Set(auditLogs.map(l => l.module))).sort();

  const filtered = auditLogs.filter(log => {
    const q = search.toLowerCase();
    const matchQ = !q || log.user.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.module.toLowerCase().includes(q);
    const matchM = !filterModule || log.module === filterModule;
    return matchQ && matchM;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Audit Log</span></div>
        <h1 className="page-title">Audit Log</h1>
        <p className="page-description">Riwayat perubahan data penting dan aktivitas admin.</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
            placeholder="Cari user, detail, modul..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ flex: '0 0 200px', height: 36, fontSize: 13 }}
          value={filterModule}
          onChange={e => setFilterModule(e.target.value)}
        >
          <option value="">Semua Modul</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(search || filterModule) && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearch(''); setFilterModule(''); }}>
            Reset
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--neutral-500)', marginLeft: 'auto' }}>
          {filtered.length} dari {auditLogs.length} entri
        </span>
      </div>

      {/* Legenda kategori */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.entries(CATEGORY_BADGE) as [ActionCategory, typeof CATEGORY_BADGE[ActionCategory]][]).map(([key, val]) => (
          <span key={key} style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: val.bg, color: val.color }}>
            {val.label}
          </span>
        ))}
      </div>

      {/* Tabel */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>Waktu</th>
              <th>User</th>
              <th>Modul</th>
              <th>Kategori</th>
              <th>Aksi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)', fontSize: 13 }}>
                  Tidak ada log yang sesuai filter.
                </td>
              </tr>
            ) : filtered.map(log => {
              const cat = getActionCategory(log.action);
              const badge = CATEGORY_BADGE[cat];
              const rowBg = ROW_HIGHLIGHT[cat];
              const humanAction = ACTION_LABEL[log.action] || log.action.replace(/_/g, ' ');

              return (
                <tr key={log.id} style={rowBg ? { backgroundColor: rowBg } : undefined}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--neutral-600)' }}>{log.timestamp}</td>
                  <td><span className="semibold" style={{ fontSize: 13 }}>{log.user}</span></td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: 11 }}>{log.module}</span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: badge.bg,
                      color: badge.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-800)' }}>
                    {humanAction}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--neutral-600)', maxWidth: 340 }}>
                    {log.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
