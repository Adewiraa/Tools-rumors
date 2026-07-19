'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AlertCircle, ChevronRight, Edit, Plus, Trash2, Trophy } from 'lucide-react';

export default function CompetitionsListView() {
  const router = useRouter();
  const { competitions, setCompetitions, clubs, hasPermission, logAction, triggerToast } = useApp();
  const [filterType, setFilterType] = useState('Semua');
  const [filterActive, setFilterActive] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = competitions.filter(comp => {
    const matchType = filterType === 'Semua' || comp.type === filterType;
    const matchActive = filterActive === 'Semua' || (filterActive === 'Aktif' ? comp.isActive : !comp.isActive);
    return matchType && matchActive;
  });

  const handleDelete = (id: string) => {
    const competition = competitions.find(item => item.id === id);
    setCompetitions(prev => prev.filter(item => item.id !== id));
    logAction('DELETE_COMPETITION', 'Master Kompetisi', competition?.name || id);
    triggerToast('Kompetisi berhasil dihapus.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Master Kompetisi</span></div>
          <h1 className="page-title">Master Kompetisi</h1>
          <p className="page-description">Kelola liga, piala, turnamen, musim, dan status aktif kompetisi.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={() => router.push('/competitions?edit=new')}><Plus size={16} /> Tambah Kompetisi</button>
        )}
      </div>

      <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ maxWidth: 180 }} value={filterType} onChange={event => setFilterType(event.target.value)}>
          <option value="Semua">Semua Tipe</option>
          <option value="league">Liga</option>
          <option value="cup">Piala</option>
          <option value="friendly">Friendly</option>
        </select>
        <select className="form-select" style={{ maxWidth: 180 }} value={filterActive} onChange={event => setFilterActive(event.target.value)}>
          <option value="Semua">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{filtered.length} kompetisi</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Belum ada kompetisi</h3>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kompetisi</th>
                <th>Kode</th>
                <th>Tipe</th>
                <th>Negara</th>
                <th>Musim</th>
                <th>Klub Peserta</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(comp => {
                const participants = clubs.filter(club => (club.competitionIds || []).includes(comp.id));
                return (
                  <tr key={comp.id}>
                    <td>
                      <div className="flex align-center gap-8">
                        <div style={{ width: 34, height: 34, border: '1px solid var(--neutral-200)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {comp.logoUrl?.startsWith('http') ? <img src={comp.logoUrl} alt={comp.name} style={{ width: 30, height: 30, objectFit: 'contain' }} /> : <Trophy size={16} />}
                        </div>
                        <div><span className="semibold">{comp.name}</span><div className="text-muted" style={{ fontSize: 11 }}>{comp.slug}</div></div>
                      </div>
                    </td>
                    <td>{comp.shortName}</td>
                    <td><span className={`badge ${comp.type === 'league' ? 'badge-info' : comp.type === 'cup' ? 'badge-warning' : 'badge-draft'}`}>{comp.type}</span></td>
                    <td>{comp.country}</td>
                    <td>{comp.season}</td>
                    <td>{participants.length || '-'}</td>
                    <td><span className={`badge ${comp.isActive ? 'badge-success' : 'badge-draft'}`}>{comp.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td className="text-right">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => router.push(`/competitions?edit=${comp.id}`)}><Edit size={13} /> Edit</button>
                        {hasPermission('Master', 'delete') && (confirmDeleteId === comp.id ? (
                          <>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(comp.id)}>Ya</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                          </>
                        ) : (
                          <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(comp.id)}><Trash2 size={13} /></button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
