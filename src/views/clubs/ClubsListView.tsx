'use client';

import React, { useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { Club, calculateClubCompleteness } from '@/lib/mockData';
import { ChevronRight, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '@/logic/apiClient';
import LoadingButton from '@/views/shared/LoadingButton';
import { generateUUID } from '@/logic/utils';

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
    address?: string;
    capacity?: number;
    surface?: string;
    image?: string;
  };
};

const buildClubCode = (name?: string, code?: string) => (
  (code || (name || '').split(/\s+/).map(part => part[0]).join('')).slice(0, 3).toUpperCase()
);

const createClubFromApiTeam = (candidate: ApiTeamCandidate): Club => {
  const teamName = candidate.team?.name || 'Klub API';
  const club: Club = {
    id: generateUUID(),
    name: teamName,
    shortName: teamName,
    code: buildClubCode(teamName, candidate.team?.code),
    city: candidate.venue?.city || candidate.team?.country || '',
    stadium: candidate.venue?.name || '',
    founded: 2026,
    homeColor: '#66756A',
    awayColor: '#E2E8F0',
    thirdColor: '#111827',
    logoUrl: candidate.team?.logo || '',
    coach: '',
    activePlayersCount: 0,
    completeness: 0,
    status: 'active',
    competitionIds: [],
  };

  return {
    ...club,
    completeness: calculateClubCompleteness(club),
  };
};

export default function ClubsListView() {
  const { clubs, setClubs, hasPermission, logAction, triggerToast } = useApp();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [apiSearch, setApiSearch] = useState('');
  const [apiTeams, setApiTeams] = useState<ApiTeamCandidate[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [addingApiTeamId, setAddingApiTeamId] = useState<number | null>(null);

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

  const addApiTeamToMaster = async (candidate: ApiTeamCandidate) => {
    const newClub = createClubFromApiTeam(candidate);
    const duplicate = clubs.find(club =>
      club.name.trim().toLowerCase() === newClub.name.trim().toLowerCase() ||
      (newClub.code && club.code.trim().toLowerCase() === newClub.code.trim().toLowerCase())
    );

    if (duplicate) {
      triggerToast(`${newClub.name} sudah ada di Master Klub.`, 'warning');
      return;
    }

    setAddingApiTeamId(candidate.team?.id || null);
    try {
      const result = await apiRequest('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club: newClub }),
      });

      if (!result.success) {
        triggerToast(`Gagal menambahkan klub API: ${result.error}`, 'error');
        return;
      }

      setClubs(prev => [...prev, newClub]);
      logAction('CREATE_CLUB_FROM_API', 'Master Klub', `Menambahkan klub dari API-Football: ${newClub.name}`);
      triggerToast(`${newClub.name} berhasil ditambahkan ke Master Klub.`);
      setApiTeams(prev => prev.filter(item => item.team?.id !== candidate.team?.id));
    } catch (error: any) {
      triggerToast(error.message || 'Terjadi kesalahan saat menambahkan klub API.', 'error');
    } finally {
      setAddingApiTeamId(null);
    }
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
          <button className="btn btn-md btn-primary" onClick={() => window.location.href = '/clubs?edit=new'}>
            <Plus size={16} /> Tambah Klub
          </button>
        )}
      </div>

      {hasPermission('Master', 'create_edit') && (
        <div className="card" style={{ padding: '18px 24px', display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 560px)', gap: 16, alignItems: 'end' }}>
            <div style={{ minWidth: 0 }}>
              <div className="semibold" style={{ fontSize: 14 }}>Ambil Data Klub dari API-Football</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Cari klub, lihat detail kandidat, lalu tambahkan langsung ke Master Klub.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
              <label className="search-input-wrapper" style={{ maxWidth: 'none', margin: 0 }}>
                <Search className="search-icon" size={16} />
                <input
                  className="form-input"
                  placeholder="Contoh: Borneo, Persib, Arema"
                  value={apiSearch}
                  onChange={event => setApiSearch(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') searchTeamsFromApi();
                  }}
                />
              </label>
              <LoadingButton className="btn btn-md btn-secondary" onClick={searchTeamsFromApi} loading={isSearchingApi} loadingLabel="Mencari...">
                Cari API
              </LoadingButton>
            </div>
          </div>

          {apiTeams.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              {apiTeams.map(candidate => (
                <div
                  key={`${candidate.team?.id}-${candidate.team?.name}`}
                  style={{ border: '1px solid var(--neutral-200)', background: 'var(--white)', borderRadius: 8, padding: 14, display: 'grid', gap: 12, minWidth: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {candidate.team?.logo ? (
                      <img src={candidate.team.logo} alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--neutral-100)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>-</div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="semibold" style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidate.team?.name}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>ID API: {candidate.team?.id || '-'}</div>
                    </div>
                    <span className="badge badge-info" style={{ flexShrink: 0 }}>{candidate.team?.country || '-'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, fontSize: 12 }}>
                    <div><span className="text-muted">Kode</span><div className="semibold">{candidate.team?.code || buildClubCode(candidate.team?.name)}</div></div>
                    <div><span className="text-muted">Kota</span><div className="semibold">{candidate.venue?.city || '-'}</div></div>
                    <div><span className="text-muted">Stadion</span><div className="semibold">{candidate.venue?.name || '-'}</div></div>
                    <div><span className="text-muted">Kapasitas</span><div className="semibold">{candidate.venue?.capacity?.toLocaleString('id-ID') || '-'}</div></div>
                  </div>
                  {candidate.venue?.address && (
                    <div className="text-muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{candidate.venue.address}</div>
                  )}
                  <LoadingButton
                    className="btn btn-sm btn-primary"
                    onClick={() => addApiTeamToMaster(candidate)}
                    loading={addingApiTeamId === candidate.team?.id}
                    loadingLabel="Menambahkan..."
                  >
                    <Plus size={13} /> Tambahkan ke Master Klub
                  </LoadingButton>
                </div>
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
                    <button className="btn btn-sm btn-secondary" onClick={() => window.location.href = `/clubs?edit=${club.id}`}><Edit size={13} /> Edit</button>
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
