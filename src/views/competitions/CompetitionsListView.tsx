'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { AlertCircle, ChevronRight, Edit, Plus, Trash2, Trophy } from 'lucide-react';
import { apiRequest } from '@/logic/apiClient';
import LoadingButton from '@/views/shared/LoadingButton';
import { Badge, Button, Card } from '@/components/ui';

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error ? error.message : fallback
);

export default function CompetitionsListView() {
  const router = useRouter();
  const { competitions, setCompetitions, clubs, hasPermission, logAction, triggerToast } = useApp();
  const [filterType, setFilterType] = useState('Semua');
  const [filterActive, setFilterActive] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = competitions.filter(comp => {
    const matchType = filterType === 'Semua' || comp.type === filterType;
    const matchActive = filterActive === 'Semua' || (filterActive === 'Aktif' ? comp.isActive : !comp.isActive);
    return matchType && matchActive;
  });

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const competition = competitions.find(item => item.id === id);
    setDeletingId(id);
    try {
      const result = await apiRequest(`/api/competitions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!result.success) {
        triggerToast(`Gagal menghapus kompetisi: ${result.error}`, 'error');
        return;
      }

      setCompetitions(prev => prev.filter(item => item.id !== id));
      logAction('DELETE_COMPETITION', 'Master Kompetisi', competition?.name || id);
      triggerToast('Kompetisi berhasil dihapus.');
      setConfirmDeleteId(null);
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Terjadi kesalahan saat menghapus kompetisi.'), 'error');
    } finally {
      setDeletingId(null);
    }
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
          <Button onClick={() => router.push('/competitions?edit=new')}><Plus size={16} /> Tambah Kompetisi</Button>
        )}
      </div>

      <Card style={{ padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
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
      </Card>

      {filtered.length === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Belum ada kompetisi</h3>
        </Card>
      ) : (
        <div className="table-wrapper master-table-wrapper">
          <table className="data-table master-card-table">
            <thead>
              <tr>
                <th>Kompetisi</th>
                <th>Kode</th>
                <th>Tipe</th>
                <th>Negara</th>
                <th>Musim</th>
                <th>Regulasi</th>
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
                    <td className="master-competition-cell" data-label="Kompetisi">
                      <div className="flex align-center gap-8">
                        <div style={{ width: 34, height: 34, border: `2px solid ${comp.primaryColor || 'var(--neutral-200)'}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {comp.logoUrl?.startsWith('http') ? <img src={comp.logoUrl} alt={comp.name} style={{ width: 30, height: 30, objectFit: 'contain' }} /> : <Trophy size={16} />}
                        </div>
                        <div>
                          <div className="flex align-center gap-6">
                            <span className="semibold">{comp.name}</span>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: comp.primaryColor || '#0F172A', display: 'inline-block' }} title={`Warna Identitas: ${comp.primaryColor || '#0F172A'}`} />
                          </div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{comp.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="master-info-cell" data-label="Kode">{comp.shortName}</td>
                    <td className="master-info-cell" data-label="Tipe">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <Badge status={comp.type === 'league' ? 'info' : comp.type === 'cup' ? 'warning' : 'draft'}>{comp.type}</Badge>
                        {comp.isInternational && <Badge status="warning" style={{ fontSize: 10 }}>Internasional</Badge>}
                      </div>
                    </td>
                    <td className="master-info-cell" data-label="Negara">{comp.country}</td>
                    <td className="master-info-cell" data-label="Musim">{comp.season}</td>
                    <td className="master-info-cell" data-label="Regulasi">
                      {comp.isInternational ? (
                        <span className="text-muted">-</span>
                      ) : (
                        <div style={{ display: 'grid', gap: 3, fontSize: 11 }}>
                          <span>
                            {comp.foreignRegulationFree
                              ? 'Asing: Bebas tanpa batas'
                              : `Asing: ${comp.maxForeignStarters ?? 7} XI / ${comp.maxForeignMatchday ?? 9} dibawa / ${comp.maxForeignSquad ?? 11} DSP`}
                          </span>
                          <span className="text-muted">Lokal min: {comp.minLocalStarters ?? 0} XI / {comp.minLocalMatchday ?? 0} dibawa</span>
                        </div>
                      )}
                    </td>
                    <td className="master-info-cell" data-label="Klub Peserta">{participants.length || '-'}</td>
                    <td className="master-info-cell" data-label="Status"><Badge status={comp.isActive ? 'success' : 'draft'}>{comp.isActive ? 'Aktif' : 'Nonaktif'}</Badge></td>
                    <td className="master-actions-cell text-right">
                      <div className="master-actions">
                        <Button size="sm" variant="secondary" onClick={() => router.push(`/competitions?edit=${comp.id}`)}><Edit size={13} /> Edit</Button>
                        {hasPermission('Master', 'delete') && (confirmDeleteId === comp.id ? (
                          <>
                            <LoadingButton className="btn btn-sm btn-danger" onClick={() => handleDelete(comp.id)} loading={deletingId === comp.id} loadingLabel="Menghapus...">Ya</LoadingButton>
                            <Button size="sm" variant="secondary" disabled={deletingId === comp.id} onClick={() => setConfirmDeleteId(null)}>Batal</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(comp.id)}><Trash2 size={13} /></Button>
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
