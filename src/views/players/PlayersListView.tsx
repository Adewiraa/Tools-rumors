'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PlayerEditorView from './PlayerEditorView';
import { useApp } from '@/logic/AppContext';
import { Club, Player, calculatePlayerCompleteness } from '@/lib/mockData';
import { countriesList, findCountry, getCountryFlagUrl } from '@/lib/countriesData';
import { Activity, ChevronRight, Edit, Flag, Hash, Plus, Search, Shield, Trash2, UserRound, Users, X } from 'lucide-react';
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
    status: 'active',
    availability: 'available',
    completeness: 0,
  };

  return {
    ...player,
    completeness: calculatePlayerCompleteness(player),
  };
};

const getAvailabilityLabel = (availability: Player['availability']) => {
  const labelMap: Record<Player['availability'], string> = {
    available: 'Tersedia',
    injured: 'Cedera',
    suspended: 'Skorsing',
    international_duty: 'Timnas',
    doubtful: 'Diragukan',
  };

  return labelMap[availability] || availability;
};

const getAvailabilityBadgeClass = (availability: Player['availability']) => (
  availability === 'available' ? 'badge-success' : availability === 'injured' || availability === 'suspended' ? 'badge-danger' : 'badge-warning'
);

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error ? error.message : fallback
);

export default function PlayersListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEditId = searchParams?.get('edit');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(urlEditId);

  useEffect(() => {
    if (urlEditId) {
      setEditingPlayerId(urlEditId);
    }
  }, [urlEditId]);

  const handleCloseEditor = () => {
    setEditingPlayerId(null);
    window.history.replaceState(null, '', '/players');
  };

  const { players, setPlayers, clubs, hasPermission, logAction, triggerToast } = useApp();
  const [selectedClubId, setSelectedClubId] = useState('Semua');
  const [selectedPosition, setSelectedPosition] = useState('Semua');
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
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
  const [apiSquadSearchTerm, setApiSquadSearchTerm] = useState('');

  const filteredPlayers = players.filter(player => {
    const search = playerSearchTerm.trim().toLowerCase();
    const matchClub = selectedClubId === 'Semua' || player.clubId === selectedClubId;
    const matchPosition = selectedPosition === 'Semua' || player.position === selectedPosition;
    const matchSearch = !search
      || player.fullName.toLowerCase().includes(search)
      || player.displayName.toLowerCase().includes(search)
      || player.clubName.toLowerCase().includes(search)
      || player.nationality.toLowerCase().includes(search);
    return matchClub && matchPosition && matchSearch;
  });
  const selectedClub = selectedClubId === 'Semua' ? undefined : clubs.find(club => club.id === selectedClubId);
  const selectedClubName = selectedClub?.name || 'Semua Klub';
  const selectedClubPlayersCount = selectedClubId === 'Semua' ? players.length : players.filter(player => player.clubId === selectedClubId).length;
  const positionSummary = (['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] as Player['position'][]).map(position => ({
    position,
    count: filteredPlayers.filter(player => player.position === position).length,
  }));

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
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Gagal mencari klub dari API.'), 'error');
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
    setApiSquadSearchTerm('');
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
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Gagal mengambil skuad klub dari API.'), 'error');
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
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Terjadi kesalahan saat menambahkan pemain API.'), 'error');
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
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Terjadi kesalahan saat menghapus pemain.'), 'error');
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
          <button className="btn btn-md btn-primary" onClick={() => setEditingPlayerId('new')}><Plus size={16} /> Tambah Pemain</button>
        )}
      </div>

      {hasPermission('Master', 'create_edit') && (
        <div className="card api-import-card" style={{ padding: '18px 24px', display: 'grid', gap: 14 }}>
          <div className="api-import-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 560px)', gap: 16, alignItems: 'end' }}>
            <div className="api-import-copy" style={{ minWidth: 0 }}>
              <div className="semibold" style={{ fontSize: 14 }}>Ambil Pemain dari API-Football</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Cari klub, ambil skuad aktif, lalu tambahkan pemain ke Master Pemain.</div>
            </div>
            <div className="api-import-search" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
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
            <div className="api-import-team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
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
            <div className="api-import-squad" style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: 14, display: 'grid', gap: 12 }}>
              <div className="api-import-squad-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(260px, 360px)', gap: 12, alignItems: 'end' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="semibold" style={{ fontSize: 14 }}>{selectedApiTeam?.team?.name || 'Skuad API'}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Pemain akan disimpan ke klub lokal yang dipilih di kanan.</div>
                </div>
                <div>
                  <label className="form-label">Tujuan (Klub / Negara)</label>
                  <select className="form-select" value={selectedMasterClubId} onChange={event => setSelectedMasterClubId(event.target.value)}>
                    <option value="">Pilih klub/negara lokal</option>
                    <optgroup label="Klub">
                      {clubs.filter(c => !c.isNationalTeam).map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
                    </optgroup>
                    <optgroup label="Negara (Tim Nasional)">
                      {clubs.filter(c => c.isNationalTeam).map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>

              {isLoadingSquad ? (
                <div className="text-muted" style={{ padding: '18px 0', fontSize: 13 }}>Mengambil data pemain klub...</div>
              ) : apiSquadPlayers.length > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', marginTop: 4 }}>
                    <label className="search-input-wrapper" style={{ maxWidth: 'none', margin: 0 }}>
                      <Search className="search-icon" size={16} />
                      <input
                        className="form-input"
                        placeholder="Filter nama, nomor, atau posisi pemain skuad API..."
                        value={apiSquadSearchTerm}
                        onChange={event => setApiSquadSearchTerm(event.target.value)}
                      />
                    </label>
                    {apiSquadSearchTerm && (
                      <button className="btn btn-sm btn-secondary" onClick={() => setApiSquadSearchTerm('')}>Reset</button>
                    )}
                  </div>
                  <div className="api-import-squad-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
                    {apiSquadPlayers
                      .filter(apiPlayer => {
                        const q = apiSquadSearchTerm.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (apiPlayer.name || '').toLowerCase().includes(q) ||
                          String(apiPlayer.number || '').includes(q) ||
                          (apiPlayer.position || '').toLowerCase().includes(q)
                        );
                      })
                      .map(apiPlayer => (
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
                </>
              ) : (
                <div className="text-muted" style={{ padding: '18px 0', fontSize: 13 }}>Belum ada data pemain dari klub API ini.</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card player-mobile-filter-card" style={{ padding: 18, display: 'grid', gap: 14 }}>
        <div className="flex justify-between align-center" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="semibold" style={{ fontSize: 14 }}>Pilih Klub</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Klik logo klub untuk melihat pemain yang terdaftar.</div>
          </div>
          <div className="player-mobile-filter-controls">
            <select className="form-select" value={selectedClubId} onChange={event => setSelectedClubId(event.target.value)}>
              <option value="Semua">Semua Klub & Negara</option>
              <optgroup label="Klub">
                {clubs.filter(c => !c.isNationalTeam).map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
              </optgroup>
              <optgroup label="Negara (Tim Nasional)">
                {clubs.filter(c => c.isNationalTeam).map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
              </optgroup>
            </select>
            <select className="form-select" value={selectedPosition} onChange={event => setSelectedPosition(event.target.value)}>
              <option value="Semua">Semua Posisi</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </select>
          </div>
        </div>

        <div className="player-club-selector-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(154px, 1fr))', gap: 10 }}>
          <button
            type="button"
            className="player-club-card"
            onClick={() => setSelectedClubId('Semua')}
            style={{
              border: selectedClubId === 'Semua' ? '2px solid var(--primary-600)' : '1px solid var(--neutral-200)',
              background: selectedClubId === 'Semua' ? 'var(--primary-600)' : 'var(--white)',
              color: selectedClubId === 'Semua' ? '#ffffff' : 'var(--neutral-950)',
              borderRadius: 8,
              padding: 12,
              cursor: 'pointer',
              display: 'grid',
              gap: 8,
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <span className="player-club-logo" style={{ width: 44, height: 44, borderRadius: 8, background: selectedClubId === 'Semua' ? 'rgba(255,255,255,0.2)' : 'var(--neutral-950)', color: 'white', display: 'grid', placeItems: 'center' }}>
              <Shield size={22} />
            </span>
            <span className="semibold" style={{ fontSize: 13, color: selectedClubId === 'Semua' ? '#ffffff' : 'var(--neutral-950)' }}>Semua Klub</span>
            <span style={{ fontSize: 11, color: selectedClubId === 'Semua' ? 'rgba(255,255,255,0.85)' : 'var(--neutral-700)' }}>{players.length} pemain</span>
          </button>

          {clubs.map(club => {
            const clubPlayersCount = players.filter(player => player.clubId === club.id).length;
            const isActiveClub = selectedClubId === club.id;
            return (
              <button
                key={club.id}
                type="button"
                className="player-club-card"
                onClick={() => setSelectedClubId(club.id)}
                style={{
                  border: isActiveClub ? '2px solid var(--primary-600)' : '1px solid var(--neutral-200)',
                  background: isActiveClub ? 'var(--primary-600)' : 'var(--white)',
                  color: isActiveClub ? '#ffffff' : 'var(--neutral-950)',
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 8,
                  textAlign: 'left',
                  minWidth: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="player-club-logo" style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--white)', border: '1px solid var(--neutral-200)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                  {club.logoUrl?.startsWith('http') ? (
                    <img src={club.logoUrl} alt={club.name} style={{ width: 38, height: 38, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 18, color: 'var(--neutral-950)' }}>{club.logoUrl || club.code}</span>
                  )}
                </span>
                <span className="semibold" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActiveClub ? '#ffffff' : 'var(--neutral-950)' }}>{club.name}</span>
                <span style={{ fontSize: 11, color: isActiveClub ? 'rgba(255,255,255,0.85)' : 'var(--neutral-700)' }}>{clubPlayersCount} pemain</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card player-roster-section" style={{ padding: 18, display: 'grid', gap: 16 }}>
        <div className="flex justify-between align-center" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="breadcrumb" style={{ marginBottom: 6 }}>
              <span>Master Pemain</span> <ChevronRight size={10} /> <span>{selectedClubName}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 24, letterSpacing: 0 }}>{selectedClubName}</h2>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
              {selectedClubPlayersCount} pemain terdaftar, {filteredPlayers.length} tampil sesuai filter.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {positionSummary.map(item => (
              <span key={item.position} className="badge badge-info" style={{ minHeight: 28 }}>
                {item.position}: {item.count}
              </span>
            ))}
          </div>
        </div>

        <div className="player-roster-toolbar">
          <div className="search-input-wrapper player-search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              className="form-input"
              placeholder="Cari pemain, klub, negara..."
              value={playerSearchTerm}
              onChange={event => setPlayerSearchTerm(event.target.value)}
            />
          </div>
          {(playerSearchTerm || selectedPosition !== 'Semua' || selectedClubId !== 'Semua') && (
            <button className="btn btn-sm btn-secondary" onClick={() => { setPlayerSearchTerm(''); setSelectedPosition('Semua'); setSelectedClubId('Semua'); }}>
              Reset
            </button>
          )}
        </div>

        {filteredPlayers.length > 0 ? (
          <div className="player-roster-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {filteredPlayers.map(player => {
              const playerClub = clubs.find(club => club.id === player.clubId);
              return (
                <div
                  key={player.id}
                  className="player-roster-card"
                  style={{
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 8,
                    background: 'var(--white)',
                    overflow: 'hidden',
                    display: 'grid',
                    minHeight: 238,
                  }}
                >
                  <div style={{ padding: 14, display: 'grid', gap: 12 }}>
                    <div className="flex justify-between align-center" style={{ gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="semibold" style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.fullName}</div>
                        <div className="text-muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.displayName}</div>
                      </div>
                      <div style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--neutral-200)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {playerClub?.logoUrl?.startsWith('http') ? (
                          <img src={playerClub.logoUrl} alt={playerClub.name} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 800 }}>{playerClub?.code || '-'}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 8, padding: 10 }}>
                        <div className="text-muted" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><Hash size={12} /> Nomor</div>
                        <div className="semibold" style={{ fontSize: 18 }}>#{player.shirtNumber}</div>
                      </div>
                      <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 8, padding: 10 }}>
                        <div className="text-muted" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><UserRound size={12} /> Posisi</div>
                        <div className="semibold" style={{ fontSize: 13 }}>{player.position}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className={`badge ${getAvailabilityBadgeClass(player.availability)}`}><Activity size={12} /> {getAvailabilityLabel(player.availability)}</span>
                      {(() => {
                        const isForeign = player.nationality && player.nationality !== 'Indonesia';
                        const matchedCountry = findCountry(player.nationality) || (player.countryCode ? findCountry(player.countryCode) : undefined);
                        const flagUrl = matchedCountry ? `https://flagcdn.com/w40/${matchedCountry.code.toLowerCase()}.png` : getCountryFlagUrl(player.nationality);

                        return (
                          <span className={`badge ${isForeign ? 'badge-warning' : 'badge-draft'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <img
                              src={flagUrl}
                              alt={player.nationality}
                              style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <span>{player.nationality}</span>
                            {isForeign && (
                              <span style={{ fontSize: 9, fontWeight: 800, background: '#d97706', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>
                                INT
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </div>

                    <div>
                      <div className="flex justify-between align-center" style={{ marginBottom: 6 }}>
                        <span className="text-muted" style={{ fontSize: 11 }}>Kelengkapan</span>
                        <span className="semibold" style={{ fontSize: 11 }}>{player.completeness}%</span>
                      </div>
                      <div style={{ height: 7, background: 'var(--neutral-200)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${player.completeness}%`, height: '100%', background: player.completeness >= 80 ? 'var(--success-600)' : 'var(--warning-600)' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--neutral-100)', padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'var(--neutral-50)' }}>
                    <span className="text-muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {playerClub?.name || player.clubName || 'Free Agent'}
                    </span>
                    <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditingPlayerId(player.id)}><Edit size={13} /> Edit</button>
                      {hasPermission('Master', 'delete') && (confirmDeleteId === player.id ? (
                        <>
                          <LoadingButton className="btn btn-sm btn-danger" onClick={() => handleDelete(player.id)} loading={deletingId === player.id} loadingLabel="Menghapus...">Ya</LoadingButton>
                          <button className="btn btn-sm btn-secondary" disabled={deletingId === player.id} onClick={() => setConfirmDeleteId(null)}>Batal</button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(player.id)}><Trash2 size={13} /></button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ border: '1px dashed var(--neutral-300)', borderRadius: 8, padding: '34px 16px', textAlign: 'center', color: 'var(--neutral-500)' }}>
            <Users size={32} style={{ marginBottom: 10 }} />
            <div className="semibold" style={{ color: 'var(--neutral-700)' }}>Belum ada pemain untuk pilihan ini</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Pilih klub lain, ubah filter posisi, atau tambahkan pemain baru.</div>
          </div>
        )}
      </div>

      {editingPlayerId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 960, maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-lg)', padding: 24, position: 'relative' }}>
            <button 
              onClick={handleCloseEditor}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 4, transition: 'background-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--neutral-100)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Tutup"
            >
              <X size={20} />
            </button>
            <PlayerEditorView playerId={editingPlayerId} onClose={handleCloseEditor} />
          </div>
        </div>
      )}
    </div>
  );
}
