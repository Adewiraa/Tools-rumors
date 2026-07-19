'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Club, Player, calculatePlayerCompleteness } from '@/lib/mockData';
import { countriesList } from '@/lib/countriesData';
import { ChevronRight, Edit, Plus, Search, Trash2, Users } from 'lucide-react';
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
  };
};

type ApiSquadPlayer = {
  id?: number;
  name?: string;
  age?: number;
  number?: number;
  position?: string;
  photo?: string;
};

type ApiSquadResponse = {
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  players?: ApiSquadPlayer[];
};

type ApiPlayerProfile = {
  id?: number;
  name?: string;
  age?: number;
  nationality?: string;
  number?: number;
  position?: string;
  photo?: string;
};

const normalizeText = (value?: string) => (
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
);

const normalizeCode = (value?: string) => (
  (value || '').trim().toLowerCase()
);

const findMatchingLocalClub = (apiTeam: ApiTeamCandidate, clubs: Club[]) => {
  const apiName = normalizeText(apiTeam.team?.name);
  const apiCode = normalizeCode(apiTeam.team?.code);

  return clubs.find(club => normalizeText(club.name) === apiName)
    || clubs.find(club => normalizeText(club.shortName) === apiName)
    || clubs.find(club => apiCode && normalizeCode(club.code) === apiCode);
};

const mapApiPosition = (position?: string): Player['position'] => {
  const normalized = (position || '').toLowerCase();
  if (normalized.includes('goalkeeper')) return 'Goalkeeper';
  if (normalized.includes('defender')) return 'Defender';
  if (normalized.includes('midfielder')) return 'Midfielder';
  if (normalized.includes('attacker') || normalized.includes('forward')) return 'Forward';
  return 'Midfielder';
};

const createPlayerFromApiSquad = (apiPlayer: ApiSquadPlayer, club: Club, apiProfile?: ApiPlayerProfile): Player => {
  const nationality = apiProfile?.nationality || 'Indonesia';
  const country = countriesList.find(item => item.name.toLowerCase() === nationality.toLowerCase());
  const fullName = apiProfile?.name || apiPlayer.name || 'Pemain API';
  const player: Player = {
    id: generateUUID(),
    fullName,
    displayName: fullName,
    clubId: club.id,
    clubName: club.name,
    position: mapApiPosition(apiProfile?.position || apiPlayer.position),
    shirtNumber: Number(apiProfile?.number ?? apiPlayer.number) || 0,
    nationality,
    countryCode: country?.code?.toUpperCase() || 'ID',
    flagUrl: country?.flagUrl || 'https://flags.restcountries.com/v5/svg/id.svg',
    age: Number(apiProfile?.age ?? apiPlayer.age) || 20,
    contractStart: '2026-01-01',
    contractEnd: '2027-12-31',
    status: 'active',
    availability: 'available',
    completeness: 0,
  };

  return {
    ...player,
    completeness: calculatePlayerCompleteness(player),
  };
};

export default function PlayersListView() {
  const router = useRouter();
  const { players, setPlayers, clubs, hasPermission, logAction, triggerToast } = useApp();
  const [selectedClubId, setSelectedClubId] = useState('Semua');
  const [selectedPosition, setSelectedPosition] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [apiClubSearch, setApiClubSearch] = useState('');
  const [apiTeams, setApiTeams] = useState<ApiTeamCandidate[]>([]);
  const [selectedApiTeam, setSelectedApiTeam] = useState<ApiTeamCandidate | null>(null);
  const [selectedMasterClubId, setSelectedMasterClubId] = useState('');
  const [apiSquadPlayers, setApiSquadPlayers] = useState<ApiSquadPlayer[]>([]);
  const [isSearchingApiClubs, setIsSearchingApiClubs] = useState(false);
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [addingApiPlayerId, setAddingApiPlayerId] = useState<number | null>(null);

  const filteredPlayers = players.filter(player => {
    const matchClub = selectedClubId === 'Semua' || player.clubId === selectedClubId;
    const matchPosition = selectedPosition === 'Semua' || player.position === selectedPosition;
    return matchClub && matchPosition;
  });

  const searchClubsFromApi = async () => {
    const query = apiClubSearch.trim();
    if (query.length < 3) {
      triggerToast('Masukkan minimal 3 karakter untuk mencari klub API.', 'warning');
      return;
    }

    setIsSearchingApiClubs(true);
    try {
      const response = await fetch(`/api/integrations/api-football?resource=teams&search=${encodeURIComponent(query)}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Gagal mencari klub dari API.');

      const teams = Array.isArray(result.data?.response) ? result.data.response : [];
      setApiTeams(teams.slice(0, 6));
      setSelectedApiTeam(null);
      setApiSquadPlayers([]);
      triggerToast(`${teams.length} kandidat klub ditemukan dari API.`);
    } catch (error: any) {
      triggerToast(error.message || 'Gagal mencari klub dari API.', 'error');
    } finally {
      setIsSearchingApiClubs(false);
    }
  };

  const loadSquadFromApi = async (candidate: ApiTeamCandidate) => {
    const teamId = candidate.team?.id;
    if (!teamId) {
      triggerToast('ID klub API tidak ditemukan.', 'error');
      return;
    }

    const matchedClub = findMatchingLocalClub(candidate, clubs);
    setSelectedApiTeam(candidate);
    setSelectedMasterClubId(matchedClub?.id || (selectedClubId !== 'Semua' ? selectedClubId : ''));
    setIsLoadingSquad(true);
    try {
      const response = await fetch(`/api/integrations/api-football?resource=playerSquads&team=${encodeURIComponent(String(teamId))}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Gagal mengambil skuad klub dari API.');

      const squadGroups: ApiSquadResponse[] = Array.isArray(result.data?.response) ? result.data.response : [];
      const squad = squadGroups.flatMap(group => Array.isArray(group.players) ? group.players : []);
      setApiSquadPlayers(squad);
      triggerToast(`${squad.length} pemain ditemukan dari skuad ${candidate.team?.name || 'API'}.`);
    } catch (error: any) {
      triggerToast(error.message || 'Gagal mengambil skuad klub dari API.', 'error');
      setApiSquadPlayers([]);
    } finally {
      setIsLoadingSquad(false);
    }
  };

  const addApiPlayerToMaster = async (apiPlayer: ApiSquadPlayer) => {
    const targetClub = clubs.find(club => club.id === selectedMasterClubId);
    if (!targetClub) {
      triggerToast('Pilih klub lokal tujuan sebelum menambahkan pemain.', 'warning');
      return;
    }

    const duplicate = players.find(player =>
      normalizeText(player.fullName) === normalizeText(apiPlayer.name) &&
      player.clubId === targetClub.id
    );

    if (duplicate) {
      triggerToast(`${apiPlayer.name} sudah ada di Master Pemain untuk ${targetClub.name}.`, 'warning');
      return;
    }

    setAddingApiPlayerId(apiPlayer.id || null);
    try {
      let apiProfile: ApiPlayerProfile | undefined;
      if (apiPlayer.id) {
        try {
          const profileResponse = await fetch(`/api/integrations/api-football?resource=playerProfiles&player=${encodeURIComponent(String(apiPlayer.id))}`);
          const profileResult = await profileResponse.json();
          const profiles = Array.isArray(profileResult.data?.response) ? profileResult.data.response : [];
          apiProfile = profiles[0]?.player;
        } catch {
          apiProfile = undefined;
        }
      }

      const newPlayer = createPlayerFromApiSquad(apiPlayer, targetClub, apiProfile);
      const result = await apiRequest('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', player: newPlayer }),
      });

      if (!result.success) {
        triggerToast(`Gagal menambahkan pemain API: ${result.error}`, 'error');
        return;
      }

      setPlayers(prev => [...prev, newPlayer]);
      logAction('CREATE_PLAYER_FROM_API', 'Master Pemain', `Menambahkan pemain dari API-Football: ${newPlayer.fullName}`);
      triggerToast(`${newPlayer.fullName} berhasil ditambahkan ke Master Pemain.`);
      setApiSquadPlayers(prev => prev.filter(item => item.id !== apiPlayer.id));
    } catch (error: any) {
      triggerToast(error.message || 'Terjadi kesalahan saat menambahkan pemain API.', 'error');
    } finally {
      setAddingApiPlayerId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const player = players.find(item => item.id === id);
    setDeletingId(id);
    try {
      const result = await apiRequest(`/api/players?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!result.success) {
        triggerToast(`Gagal menghapus pemain: ${result.error}`, 'error');
        return;
      }

      setPlayers(prev => prev.filter(item => item.id !== id));
      logAction('DELETE_PLAYER', 'Master Pemain', player?.fullName || id);
      triggerToast('Pemain berhasil dihapus.');
      setConfirmDeleteId(null);
    } catch (error: any) {
      triggerToast(error.message || 'Terjadi kesalahan saat menghapus pemain.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Master Pemain</span></div>
          <h1 className="page-title">Master Pemain</h1>
          <p className="page-description">Kelola profil pemain, klub aktif, posisi, nomor punggung, negara, dan availability.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={() => router.push('/players?edit=new')}><Plus size={16} /> Tambah Pemain</button>
        )}
      </div>

      {hasPermission('Master', 'create_edit') && (
        <div className="card" style={{ padding: '18px 24px', display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 560px)', gap: 16, alignItems: 'end' }}>
            <div style={{ minWidth: 0 }}>
              <div className="semibold" style={{ fontSize: 14 }}>Ambil Pemain dari API-Football</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Cari klub, ambil skuad aktif, lalu tambahkan pemain ke Master Pemain.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
              <label className="search-input-wrapper" style={{ maxWidth: 'none', margin: 0 }}>
                <Search className="search-icon" size={16} />
                <input
                  className="form-input"
                  placeholder="Contoh: Persita, Persib, Arema"
                  value={apiClubSearch}
                  onChange={event => setApiClubSearch(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') searchClubsFromApi();
                  }}
                />
              </label>
              <LoadingButton className="btn btn-md btn-secondary" onClick={searchClubsFromApi} loading={isSearchingApiClubs} loadingLabel="Mencari...">
                Cari Klub
              </LoadingButton>
            </div>
          </div>

          {apiTeams.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {apiTeams.map(candidate => {
                const matchedClub = findMatchingLocalClub(candidate, clubs);
                const isActive = selectedApiTeam?.team?.id === candidate.team?.id;
                return (
                  <button
                    key={`${candidate.team?.id}-${candidate.team?.name}`}
                    type="button"
                    onClick={() => loadSquadFromApi(candidate)}
                    style={{ border: `1px solid ${isActive ? 'var(--primary-600)' : 'var(--neutral-200)'}`, background: 'var(--white)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer', minWidth: 0 }}
                  >
                    {candidate.team?.logo ? (
                      <img src={candidate.team.logo} alt="" style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: 6, background: 'var(--neutral-100)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>-</div>
                    )}
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="semibold" style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidate.team?.name}</span>
                      <span className="text-muted" style={{ display: 'block', fontSize: 11 }}>{candidate.venue?.city || candidate.team?.country || '-'}{matchedClub ? ` - cocok: ${matchedClub.name}` : ' - pilih klub tujuan'}</span>
                    </span>
                    <span className="badge badge-info"><Users size={12} /> Skuad</span>
                  </button>
                );
              })}
            </div>
          )}

          {(selectedApiTeam || isLoadingSquad || apiSquadPlayers.length > 0) && (
            <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: 14, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(260px, 360px)', gap: 12, alignItems: 'end' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="semibold" style={{ fontSize: 14 }}>{selectedApiTeam?.team?.name || 'Skuad API'}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Pemain akan disimpan ke klub lokal yang dipilih di kanan.</div>
                </div>
                <div>
                  <label className="form-label">Klub Master Tujuan</label>
                  <select className="form-select" value={selectedMasterClubId} onChange={event => setSelectedMasterClubId(event.target.value)}>
                    <option value="">Pilih klub lokal</option>
                    {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
                  </select>
                </div>
              </div>

              {isLoadingSquad ? (
                <div className="text-muted" style={{ padding: '18px 0', fontSize: 13 }}>Mengambil data pemain klub...</div>
              ) : apiSquadPlayers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
                  {apiSquadPlayers.map(apiPlayer => (
                    <div key={`${apiPlayer.id}-${apiPlayer.name}`} style={{ border: '1px solid var(--neutral-200)', borderRadius: 8, padding: 12, display: 'grid', gap: 10, background: 'var(--white)' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                        {apiPlayer.photo ? (
                          <img src={apiPlayer.photo} alt="" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--neutral-100)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>-</div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="semibold" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apiPlayer.name}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>#{apiPlayer.number || 0} - {mapApiPosition(apiPlayer.position)} - {apiPlayer.age || '-'} tahun</div>
                        </div>
                      </div>
                      <LoadingButton
                        className="btn btn-sm btn-primary"
                        onClick={() => addApiPlayerToMaster(apiPlayer)}
                        loading={addingApiPlayerId === apiPlayer.id}
                        loadingLabel="Menambahkan..."
                        disabled={!selectedMasterClubId}
                      >
                        <Plus size={13} /> Tambahkan ke Master Pemain
                      </LoadingButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted" style={{ padding: '18px 0', fontSize: 13 }}>Belum ada data pemain dari klub API ini.</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <select className="form-select" style={{ maxWidth: 280 }} value={selectedClubId} onChange={event => setSelectedClubId(event.target.value)}>
          <option value="Semua">Semua Klub</option>
          {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 220 }} value={selectedPosition} onChange={event => setSelectedPosition(event.target.value)}>
          <option value="Semua">Semua Posisi</option>
          <option value="Goalkeeper">Goalkeeper</option>
          <option value="Defender">Defender</option>
          <option value="Midfielder">Midfielder</option>
          <option value="Forward">Forward</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Negara</th>
              <th>Nama</th>
              <th>Klub</th>
              <th>Posisi</th>
              <th>No</th>
              <th>Availability</th>
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => (
                <tr key={player.id}>
                  <td>{player.flagUrl?.startsWith('http') ? <img src={player.flagUrl} alt={player.nationality} style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }} /> : player.flagUrl}</td>
                  <td><span className="semibold">{player.fullName}</span><div className="text-muted" style={{ fontSize: 11 }}>{player.displayName}</div></td>
                  <td>{clubs.find(club => club.id === player.clubId)?.name || player.clubName || 'Free Agent'}</td>
                  <td>{player.position}</td>
                  <td>#{player.shirtNumber}</td>
                  <td><span className={`badge ${player.availability === 'available' ? 'badge-success' : 'badge-warning'}`}>{player.availability}</span></td>
                  <td>
                    <div className="flex align-center gap-8">
                      <div style={{ width: 70, height: 6, background: 'var(--neutral-200)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${player.completeness}%`, height: '100%', background: player.completeness >= 80 ? 'var(--success-600)' : 'var(--warning-600)' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{player.completeness}%</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => router.push(`/players?edit=${player.id}`)}><Edit size={13} /> Edit</button>
                      {hasPermission('Master', 'delete') && (confirmDeleteId === player.id ? (
                        <>
                          <LoadingButton className="btn btn-sm btn-danger" onClick={() => handleDelete(player.id)} loading={deletingId === player.id} loadingLabel="Menghapus...">Ya</LoadingButton>
                          <button className="btn btn-sm btn-secondary" disabled={deletingId === player.id} onClick={() => setConfirmDeleteId(null)}>Batal</button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(player.id)}><Trash2 size={13} /></button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--neutral-500)' }}>
                  Tidak ada data pemain untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
