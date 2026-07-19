'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '@/logic/apiClient';
import LoadingButton from '@/views/shared/LoadingButton';

type ApiTeamCandidate = {
  team?: {
    id?: number;
    name?: string;
    code?: string;
    country?: string;
    logo?: string;
  };
  venue?: {
    name?: string;
    city?: string;
  };
};

export default function ClubsListView() {
  const router = useRouter();
  const { clubs, setClubs, hasPermission, logAction, triggerToast } = useApp();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [apiSearch, setApiSearch] = useState('');
  const [apiTeams, setApiTeams] = useState<ApiTeamCandidate[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const searchTeamsFromApi = async () => {
    const query = apiSearch.trim();
    if (query.length < 3) {
      triggerToast('Masukkan minimal 3 karakter untuk mencari klub API.', 'warning');
      return;
    }

    setIsSearchingApi(true);
    try {
      const response = await fetch(`/api/integrations/api-football?resource=teams&search=${encodeURIComponent(query)}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Gagal mencari klub dari API.');

      const teams = Array.isArray(result.data?.response) ? result.data.response : [];
      setApiTeams(teams.slice(0, 8));
      triggerToast(`${teams.length} kandidat klub ditemukan dari API.`);
    } catch (error: any) {
      triggerToast(error.message || 'Gagal mencari klub dari API.', 'error');
    } finally {
      setIsSearchingApi(false);
    }
  };

  const openApiTeamAsDraft = (candidate: ApiTeamCandidate) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('gosball_api_team_draft', JSON.stringify(candidate));
    }
    router.push('/clubs?edit=new');
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const club = clubs.find(item => item.id === id);
    setDeletingId(id);
    try {
      const result = await apiRequest(`/api/clubs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!result.success) {
        triggerToast(`Gagal menghapus klub: ${result.error}`, 'error');
        return;
      }

      setClubs(prev => prev.filter(item => item.id !== id));
      logAction('DELETE_CLUB', 'Master Klub', club?.name || id);
      triggerToast('Klub berhasil dihapus.');
      setConfirmDeleteId(null);
    } catch (error: any) {
      triggerToast(error.message || 'Terjadi kesalahan saat menghapus klub.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Master Klub</span></div>
          <h1 className="page-title">Master Klub</h1>
          <p className="page-description">Kelola identitas klub, stadion, pelatih, warna, dan logo.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={() => router.push('/clubs?edit=new')}>
            <Plus size={16} /> Tambah Klub
          </button>
        )}
      </div>

      {hasPermission('Master', 'create_edit') && (
        <div className="card" style={{ padding: '16px 24px', display: 'grid', gap: 12 }}>
          <div className="flex justify-between align-center gap-12" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="semibold" style={{ fontSize: 14 }}>Ambil Data Klub dari API-Football</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Cari klub, pilih kandidat, lalu review di form tambah klub sebelum disimpan.</div>
            </div>
            <div className="flex gap-8" style={{ flex: '1 1 340px', justifyContent: 'flex-end' }}>
              <div className="search-input-wrapper" style={{ maxWidth: 360, width: '100%' }}>
                <Search className="search-icon" size={16} />
                <input
                  className="search-input"
                  placeholder="Cari nama klub API..."
                  value={apiSearch}
                  onChange={event => setApiSearch(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') searchTeamsFromApi();
                  }}
                />
              </div>
              <LoadingButton className="btn btn-sm btn-secondary" onClick={searchTeamsFromApi} loading={isSearchingApi} loadingLabel="Mencari...">
                Cari API
              </LoadingButton>
            </div>
          </div>

          {apiTeams.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {apiTeams.map(candidate => (
                <button
                  key={`${candidate.team?.id}-${candidate.team?.name}`}
                  type="button"
                  onClick={() => openApiTeamAsDraft(candidate)}
                  style={{ border: '1px solid var(--neutral-200)', background: 'var(--white)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', minWidth: 0 }}
                >
                  {candidate.team?.logo ? (
                    <img src={candidate.team.logo} alt="" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--neutral-100)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>-</div>
                  )}
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="semibold" style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidate.team?.name}</span>
                    <span className="text-muted" style={{ fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {candidate.team?.country || '-'}{candidate.venue?.name ? ` - ${candidate.venue.name}` : ''}
                    </span>
                  </span>
                  <span className="badge badge-info" style={{ flexShrink: 0 }}>Pilih</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nama Klub</th>
              <th>Kode</th>
              <th>Kota</th>
              <th>Stadion</th>
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map(club => (
              <tr key={club.id}>
                <td>{club.logoUrl?.startsWith('http') ? <img src={club.logoUrl} alt={club.name} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <span style={{ fontSize: 22 }}>{club.logoUrl || '-'}</span>}</td>
                <td><span className="semibold">{club.name}</span><div className="text-muted" style={{ fontSize: 11 }}>{club.shortName}</div></td>
                <td>{club.code}</td>
                <td>{club.city}</td>
                <td>{club.stadium}</td>
                <td>
                  <div className="flex align-center gap-8">
                    <div style={{ width: 70, height: 6, background: 'var(--neutral-200)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${club.completeness}%`, height: '100%', background: 'var(--primary-600)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{club.completeness}%</span>
                  </div>
                </td>
                <td className="text-right">
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => router.push(`/clubs?edit=${club.id}`)}><Edit size={13} /> Edit</button>
                    {hasPermission('Master', 'delete') && (confirmDeleteId === club.id ? (
                      <>
                        <LoadingButton className="btn btn-sm btn-danger" onClick={() => handleDelete(club.id)} loading={deletingId === club.id} loadingLabel="Menghapus...">Ya</LoadingButton>
                        <button className="btn btn-sm btn-secondary" disabled={deletingId === club.id} onClick={() => setConfirmDeleteId(null)}>Batal</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(club.id)}><Trash2 size={13} /></button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
