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

const normalizeClubName = (name?: string) => (
  (name || '').trim().toLowerCase().replace(/\s+/g, ' ')
);

const normalizeClubCode = (code?: string) => (
  (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)
);

const createUniqueClubCode = (baseCode: string, clubs: Club[]) => {
  const existingCodes = new Set(clubs.map(club => normalizeClubCode(club.code)).filter(Boolean));
  const normalizedBase = normalizeClubCode(baseCode) || 'CLB';

  if (!existingCodes.has(normalizedBase)) return normalizedBase;

  for (let index = 2; index <= 99; index += 1) {
    const suffix = String(index);
    const candidate = `${normalizedBase.slice(0, Math.max(1, 3 - suffix.length))}${suffix}`;
    if (!existingCodes.has(candidate)) return candidate;
  }

  return normalizedBase;
};

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error ? error.message : fallback
);

const createClubFromApiTeam = (candidate: ApiTeamCandidate, isNationalTeam: boolean): Club => {
  const teamName = candidate.team?.name || 'Klub API';
  const club: Club = {
    id: generateUUID(),
    name: teamName,
    shortName: teamName,
    code: buildClubCode(teamName, candidate.team?.code),
    country: candidate.team?.country || 'Indonesia',
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
    isNationalTeam,
  };

  return {
    ...club,
    completeness: calculateClubCompleteness(club),
  };
};

export default function ClubsListView({ isNationalTeam = false }: { isNationalTeam?: boolean }) {
  const { clubs, setClubs, players, hasPermission, logAction, triggerToast } = useApp();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [apiSearch, setApiSearch] = useState('');
  const [apiTeams, setApiTeams] = useState<ApiTeamCandidate[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [addingApiTeamId, setAddingApiTeamId] = useState<number | null>(null);

  const displayClubs = clubs.filter(club => Boolean(club.isNationalTeam) === isNationalTeam);

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
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Gagal mencari klub dari API.'), 'error');
    } finally {
      setIsSearchingApi(false);
    }
  };

  const addApiTeamToMaster = async (candidate: ApiTeamCandidate) => {
    const apiClub = createClubFromApiTeam(candidate, isNationalTeam);
    const duplicateByName = clubs.find(club =>
      normalizeClubName(club.name) === normalizeClubName(apiClub.name)
    );

    if (duplicateByName) {
      triggerToast(`${apiClub.name} sudah ada di ${isNationalTeam ? 'Master Negara' : 'Master Klub'}.`, 'warning');
      return;
    }

    const newClub = {
      ...apiClub,
      code: createUniqueClubCode(apiClub.code, clubs),
    };

    setAddingApiTeamId(candidate.team?.id || null);
    try {
      const result = await apiRequest('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club: newClub }),
      });

      if (!result.success) {
        triggerToast(`Gagal menambahkan API: ${result.error}`, 'error');
        return;
      }

      setClubs(prev => [...prev, newClub]);
      logAction('CREATE_CLUB_FROM_API', isNationalTeam ? 'Master Negara' : 'Master Klub', `Menambahkan dari API-Football: ${newClub.name}`);
      triggerToast(`${newClub.name} berhasil ditambahkan.`);
      setApiTeams(prev => prev.filter(item => item.team?.id !== candidate.team?.id));
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Terjadi kesalahan saat menambahkan data API.'), 'error');
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
        triggerToast(`Gagal menghapus: ${result.error}`, 'error');
        return;
      }

      setClubs(prev => prev.filter(item => item.id !== id));
      logAction('DELETE_CLUB', isNationalTeam ? 'Master Negara' : 'Master Klub', club?.name || id);
      triggerToast(isNationalTeam ? 'Negara berhasil dihapus.' : 'Klub berhasil dihapus.');
      setConfirmDeleteId(null);
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Terjadi kesalahan saat menghapus data.'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>{isNationalTeam ? 'Master Negara' : 'Master Klub'}</span></div>
          <h1 className="page-title">{isNationalTeam ? 'Master Negara' : 'Master Klub'}</h1>
          <p className="page-description">{isNationalTeam ? 'Kelola identitas negara, pelatih, warna, bendera, dan pemain peserta.' : 'Kelola identitas klub, stadion, pelatih, warna, dan logo.'}</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={() => window.location.href = isNationalTeam ? '/countries?edit=new' : '/clubs?edit=new'}>
            <Plus size={16} /> {isNationalTeam ? 'Tambah Negara' : 'Tambah Klub'}
          </button>
        )}
      </div>

      {!isNationalTeam && hasPermission('Master', 'create_edit') && (
        <div className="card api-import-card" style={{ padding: '18px 24px', display: 'grid', gap: 14 }}>
          <div className="api-import-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 560px)', gap: 16, alignItems: 'end' }}>
            <div className="api-import-copy" style={{ minWidth: 0 }}>
              <div className="semibold" style={{ fontSize: 14 }}>Ambil Data Klub dari API-Football</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Cari klub, lihat detail kandidat, lalu tambahkan langsung ke Master Klub.</div>
            </div>
            <div className="api-import-search" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
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
            <div className="api-import-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              {apiTeams.map(candidate => (
                <div
                  key={`${candidate.team?.id}-${candidate.team?.name}`}
                  className="api-import-result-card"
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

      <div className="table-wrapper master-table-wrapper">
        <table className="data-table master-card-table">
          <thead>
            <tr>
              <th>{isNationalTeam ? 'Bendera' : 'Logo'}</th>
              <th>{isNationalTeam ? 'Nama Negara' : 'Nama Klub'}</th>
              <th>Kode</th>
              {isNationalTeam ? (
                <>
                  <th>Jumlah Pemain</th>
                  <th>Pelatih</th>
                </>
              ) : (
                <>
                  <th>Negara</th>
                  <th>Kota</th>
                  <th>Stadion</th>
                </>
              )}
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {displayClubs.map(club => {
              const playerCount = isNationalTeam 
                ? players.filter(p => p.nationality.toLowerCase() === club.name.toLowerCase()).length
                : players.filter(p => p.clubId === club.id).length;

              return (
                <tr key={club.id}>
                  <td className="master-logo-cell" data-label={isNationalTeam ? 'Bendera' : 'Logo'}>
                    {club.logoUrl?.startsWith('http') ? <img src={club.logoUrl} alt={club.name} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <span style={{ fontSize: 22 }}>{club.logoUrl || '-'}</span>}
                  </td>
                  <td className="master-title-cell" data-label={isNationalTeam ? 'Negara' : 'Klub'}><span className="semibold">{club.name}</span><div className="text-muted" style={{ fontSize: 11 }}>{club.shortName}</div></td>
                  <td className="master-info-cell" data-label="Kode">{club.code}</td>
                  {isNationalTeam ? (
                    <>
                      <td className="master-info-cell" data-label="Jumlah Pemain">
                        <span className="semibold" style={{ color: 'var(--primary-600)' }}>{playerCount} pemain</span>
                      </td>
                      <td className="master-info-cell" data-label="Pelatih">{club.coach || '-'}</td>
                    </>
                  ) : (
                    <>
                      <td className="master-info-cell" data-label="Negara">{club.country || 'Indonesia'}</td>
                      <td className="master-info-cell" data-label="Kota">{club.city}</td>
                      <td className="master-info-cell" data-label="Stadion">{club.stadium}</td>
                    </>
                  )}
                  <td className="master-info-cell" data-label="Kelengkapan">
                    <div className="flex align-center gap-8">
                      <div style={{ width: 70, height: 6, background: 'var(--neutral-200)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${club.completeness}%`, height: '100%', background: 'var(--primary-600)' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{club.completeness}%</span>
                    </div>
                  </td>
                  <td className="master-actions-cell text-right">
                    <div className="master-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => window.location.href = isNationalTeam ? `/countries?edit=${club.id}` : `/clubs?edit=${club.id}`}><Edit size={13} /> Edit</button>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
