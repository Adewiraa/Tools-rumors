'use client';

import React, { useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Search, ClipboardList, RotateCcw, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronsLeft, ChevronsRight } from 'lucide-react';

const ACTION_LABEL: Record<string, string> = {
  PUBLISH_RUMOR:         'Publikasi Rumor',
  UPDATE_PUBLISH_RUMOR:  'Perbarui & Publikasi Rumor',
  CREATE_RUMOR:          'Buat Draft Rumor',
  DELETE_RUMOR:          'Hapus Rumor',
  CREATE_SCHEDULE:       'Tambah Jadwal Pertandingan',
  UPDATE_SCHEDULE:       'Perbarui Jadwal Pertandingan',
  DELETE_SCHEDULE:       'Hapus Jadwal Pertandingan',
  PUBLISH_LINEUP:        'Terbitkan Lineup',
  SAVE_LINEUP_DRAFT:     'Simpan Draft Lineup',
  SAVE_MATCH_RESULT:     'Simpan Skor Pertandingan',
  PUBLISH_MATCH_RESULT:  'Publikasi Hasil Pertandingan',
  SAFETY_TRIGGERED:      'Audit Keamanan Diaktifkan',
  CREATE_PLAYER:         'Tambah Pemain',
  CREATE_PLAYER_FROM_API:'Import Pemain dari API',
  UPDATE_PLAYER:         'Perbarui Data Pemain',
  DELETE_PLAYER:         'Hapus Pemain',
  CREATE_CLUB:           'Tambah Klub',
  CREATE_CLUB_FROM_API:  'Import Klub dari API',
  UPDATE_CLUB:           'Perbarui Data Klub',
  DELETE_CLUB:           'Hapus Klub',
  CREATE_COMPETITION:    'Tambah Kompetisi',
  UPDATE_COMPETITION:    'Perbarui Kompetisi',
  DELETE_COMPETITION:    'Hapus Kompetisi',
  CREATE_USER:           'Tambah User',
  UPDATE_USER:           'Perbarui User',
  DELETE_USER:           'Hapus User',
  UPDATE_PERMISSIONS:    'Perbarui Hak Akses',
  UPLOAD_APP_LOGO:       'Upload Logo Aplikasi',
  UPDATE_APP_SETTINGS:   'Simpan Pengaturan',
  UPDATE_ACTIVE_ROLE:    'Ubah Role Aktif',
  TOGGLE_SYSTEM_SIMULATION: 'Ubah Simulasi Sistem',
};

type ActionCategory = 'publish' | 'create' | 'update' | 'delete' | 'safety' | 'other';

const getActionCategory = (action: string): ActionCategory => {
  if (action.startsWith('PUBLISH') || action.includes('PUBLISH')) return 'publish';
  if (action.startsWith('DELETE')) return 'delete';
  if (action.startsWith('CREATE') || action.startsWith('IMPORT')) return 'create';
  if (action.startsWith('UPDATE') || action.startsWith('SAVE')) return 'update';
  if (action === 'SAFETY_TRIGGERED') return 'safety';
  return 'other';
};

const CATEGORY_BADGE: Record<ActionCategory, { label: string; bg: string; color: string; cssClass: string }> = {
  publish: { label: 'Publikasi', bg: '#dcfce7', color: '#166534', cssClass: 'badge-success' },
  create:  { label: 'Tambah',   bg: '#dbeafe', color: '#1e40af', cssClass: 'badge-info' },
  update:  { label: 'Perbarui', bg: '#fef9c3', color: '#854d0e', cssClass: 'badge-warning' },
  delete:  { label: 'Hapus',    bg: '#fee2e2', color: '#991b1b', cssClass: 'badge-danger' },
  safety:  { label: 'Keamanan', bg: '#f3e8ff', color: '#6b21a8', cssClass: 'badge-draft' },
  other:   { label: 'Sistem',   bg: '#f1f5f9', color: '#475569', cssClass: 'badge-draft' },
};

const PAGE_SIZE = 20;

export default function AuditLogsView() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const modules = Array.from(new Set(auditLogs.map(l => l.module))).sort();

  const filtered = auditLogs.filter(log => {
    const q = search.toLowerCase();
    const matchQ = !q || log.user.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.module.toLowerCase().includes(q);
    const matchM = !filterModule || log.module === filterModule;
    const matchCat = !filterCategory || getActionCategory(log.action) === filterCategory;
    return matchQ && matchM && matchCat;
  });

  const isFilterActive = !!(search || filterModule || filterCategory);
  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedLogs = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleResetFilters = () => {
    setSearch('');
    setFilterModule('');
    setFilterCategory('');
    setCurrentPage(1);
  };

  // Build page window (max 5 pages visible)
  const pageWindow = Array.from({ length: totalPages }, (_, i) => i + 1)
    .slice(Math.max(0, safePage - 3), safePage + 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>Audit Log</span>
          </div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-description">Riwayat seluruh perubahan data dan aktivitas admin secara real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Entri</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--neutral-950)', lineHeight: 1.1 }}>{auditLogs.length}</div>
          </div>
          {isFilterActive && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hasil Filter</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary-600)', lineHeight: 1.1 }}>{totalEntries}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 30, height: 38, fontSize: 13 }}
              placeholder="Cari user, detail, modul..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            className="form-select"
            style={{ flex: '0 0 170px', height: 38, fontSize: 13 }}
            value={filterModule}
            onChange={e => { setFilterModule(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Semua Modul</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            className="form-select"
            style={{ flex: '0 0 155px', height: 38, fontSize: 13 }}
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Semua Kategori</option>
            {(Object.entries(CATEGORY_BADGE) as [ActionCategory, typeof CATEGORY_BADGE[ActionCategory]][]).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          {isFilterActive && (
            <button className="btn btn-sm btn-secondary" onClick={handleResetFilters} style={{ height: 38, gap: 6, fontSize: 13 }}>
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <span style={{ fontSize: 12, color: 'var(--neutral-500)', marginLeft: 'auto' }}>
            {totalEntries} dari {auditLogs.length} entri
          </span>
        </div>

        {/* Category Badge Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--neutral-200)', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', marginRight: 2 }}>Kategori:</span>
          {(Object.entries(CATEGORY_BADGE) as [ActionCategory, typeof CATEGORY_BADGE[ActionCategory]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => { setFilterCategory(filterCategory === key ? '' : key); setCurrentPage(1); }}
              className={`badge ${filterCategory === key ? 'badge-success' : val.cssClass}`}
              style={{
                cursor: 'pointer',
                border: '1px solid transparent',
                fontSize: 11,
                fontWeight: 700,
                opacity: filterCategory && filterCategory !== key ? 0.5 : 1,
                transition: 'all 0.15s ease',
                background: filterCategory === key ? val.color : val.bg,
                color: filterCategory === key ? 'white' : val.color,
              }}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="table-wrapper master-table-wrapper">
        <table className="data-table master-card-table audit-card-table">
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
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <ClipboardList size={32} color="var(--neutral-400)" style={{ margin: '0 auto 4px' }} />
                    <p style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>Tidak ada log yang sesuai filter</p>
                    {isFilterActive && (
                      <button className="btn btn-sm btn-secondary" onClick={handleResetFilters} style={{ marginTop: 4, gap: 6 }}>
                        <RotateCcw size={13} /> Reset Filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginatedLogs.map(log => {
              const cat = getActionCategory(log.action);
              const badge = CATEGORY_BADGE[cat];
              const humanAction = ACTION_LABEL[log.action] || log.action.replace(/_/g, ' ');

              return (
                <tr key={log.id}>
                  <td className="master-info-cell text-muted" data-label="Waktu" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{log.timestamp}</td>
                  <td className="master-info-cell" data-label="User"><span className="semibold" style={{ fontSize: 13 }}>{log.user}</span></td>
                  <td className="master-info-cell" data-label="Modul"><span className="badge badge-info" style={{ fontSize: 11 }}>{log.module}</span></td>
                  <td className="master-info-cell" data-label="Kategori">
                    <span className={`badge ${badge.cssClass}`} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="master-info-cell" data-label="Aksi" style={{ fontSize: 13, fontWeight: 600 }}>{humanAction}</td>
                  <td className="master-info-cell" data-label="Detail" style={{ fontSize: 12, maxWidth: 320 }}><span className="text-muted">{log.details}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
            Menampilkan <strong>{startIndex + 1}</strong>–<strong>{Math.min(startIndex + PAGE_SIZE, totalEntries)}</strong> dari <strong>{totalEntries}</strong> entri
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={safePage === 1} onClick={() => setCurrentPage(1)}>
              <ChevronsLeft size={15} />
            </button>
            <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={safePage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft size={15} />
            </button>
            {pageWindow.map(page => (
              <button key={page} className={`btn btn-sm ${safePage === page ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: 32, padding: '0 8px', fontSize: 13 }} onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            ))}
            <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={safePage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRightIcon size={15} />
            </button>
            <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={safePage === totalPages} onClick={() => setCurrentPage(totalPages)}>
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
