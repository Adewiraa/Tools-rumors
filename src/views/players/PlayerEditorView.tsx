'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { Player, calculatePlayerCompleteness } from '@/lib/mockData';
import { countriesList } from '@/lib/countriesData';
import { ArrowLeft, CheckCircle, Save, Search } from 'lucide-react';
import { generateUUID } from '@/logic/utils';
import { apiRequest } from '@/logic/apiClient';
import LoadingButton from '@/views/shared/LoadingButton';

type ApiPlayerCandidate = {
  player?: {
    id?: number;
    name?: string;
    firstname?: string;
    lastname?: string;
    age?: number;
    nationality?: string;
    photo?: string;
  };
  statistics?: Array<{
    team?: {
      id?: number;
      name?: string;
      logo?: string;
    };
    games?: {
      number?: number;
      position?: string;
    };
  }>;
};

const mapApiPosition = (position?: string): Player['position'] => {
  const normalized = (position || '').toLowerCase();
  if (normalized.includes('goalkeeper')) return 'Goalkeeper';
  if (normalized.includes('defender')) return 'Defender';
  if (normalized.includes('midfielder')) return 'Midfielder';
  if (normalized.includes('attacker') || normalized.includes('forward')) return 'Forward';
  return 'Midfielder';
};

export default function PlayerEditorView({ playerId }: { playerId: string }) {
  const { players, setPlayers, clubs, logAction, triggerToast } = useApp();
  const isNew = playerId === 'new';
  const existing = players.find(item => item.id === playerId);
  const [countryQuery, setCountryQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiSearch, setApiSearch] = useState(existing?.fullName || '');
  const [apiSeason, setApiSeason] = useState('2026');
  const [apiPlayers, setApiPlayers] = useState<ApiPlayerCandidate[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const goToPlayersList = () => {
    window.location.replace('/players');
  };
  const [player, setPlayer] = useState<Player>(existing || {
    id: generateUUID(),
    fullName: '',
    displayName: '',
    clubId: clubs[0]?.id || '',
    clubName: clubs[0]?.name || '',
    position: 'Midfielder',
    shirtNumber: 10,
    nationality: 'Indonesia',
    flagUrl: 'https://flags.restcountries.com/v5/svg/id.svg',
    age: 25,
    status: 'active',
    availability: 'available',
    completeness: 0,
  });

  const selectedClub = clubs.find(club => club.id === player.clubId);
  const liveCompleteness = calculatePlayerCompleteness(player);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    return q ? countriesList.filter(country => country.name.toLowerCase().includes(q)) : countriesList;
  }, [countryQuery]);
  const updatePlayer = <K extends keyof Player>(key: K, value: Player[K]) => setPlayer(prev => ({ ...prev, [key]: value }));

  const searchPlayersFromApi = async () => {
    const query = apiSearch.trim();
    if (query.length < 3) {
      triggerToast('Masukkan minimal 3 karakter untuk mencari pemain API.', 'warning');
      return;
    }

    setIsSearchingApi(true);
    try {
      const params = new URLSearchParams({
        resource: 'players',
        search: query,
        season: apiSeason || '2026',
      });
      const response = await fetch(`/api/integrations/api-football?${params.toString()}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Gagal mencari pemain dari API.');

      const candidates = Array.isArray(result.data?.response) ? result.data.response : [];
      setApiPlayers(candidates.slice(0, 8));
      triggerToast(`${candidates.length} kandidat pemain ditemukan dari API.`);
    } catch (error: any) {
      triggerToast(error.message || 'Gagal mencari pemain dari API.', 'error');
    } finally {
      setIsSearchingApi(false);
    }
  };

  const applyApiPlayer = (candidate: ApiPlayerCandidate) => {
    const apiPlayer = candidate.player || {};
    const firstStats = candidate.statistics?.[0];
    const nationality = apiPlayer.nationality || player.nationality;
    const country = countriesList.find(item => item.name.toLowerCase() === nationality.toLowerCase());

    setPlayer(prev => ({
      ...prev,
      fullName: apiPlayer.name || prev.fullName,
      displayName: apiPlayer.name || prev.displayName,
      age: Number(apiPlayer.age) || prev.age,
      nationality,
      flagUrl: country?.flagUrl || prev.flagUrl,
      position: mapApiPosition(firstStats?.games?.position),
      shirtNumber: Number(firstStats?.games?.number) || prev.shirtNumber,
    }));
    triggerToast('Data pemain dari API diterapkan ke form. Review lalu simpan manual.');
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!player.fullName.trim() || !player.displayName.trim()) {
      triggerToast('Nama lengkap dan display name wajib diisi.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const savedPlayer = {
        ...player,
        clubName: selectedClub?.name || '',
        completeness: liveCompleteness,
      };
      const result = await apiRequest('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', player: savedPlayer }),
      });

      if (!result.success) {
        triggerToast(`Gagal menyimpan pemain: ${result.error}`, 'error');
        return;
      }

      setPlayers(prev => isNew ? [...prev, savedPlayer] : prev.map(item => item.id === savedPlayer.id ? savedPlayer : item));
      logAction(isNew ? 'CREATE_PLAYER' : 'UPDATE_PLAYER', 'Master Pemain', savedPlayer.fullName);
      triggerToast('Pemain berhasil disimpan.');
      goToPlayersList();
    } catch (error: any) {
      triggerToast(error.message || 'Terjadi kesalahan saat menyimpan pemain.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button type="button" className="btn btn-sm btn-secondary" onClick={goToPlayersList}><ArrowLeft size={16} /> Kembali</button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>{isNew ? 'Tambah Pemain' : 'Edit Pemain'}</h1>
            <div className="text-muted" style={{ fontSize: 12 }}>Kelengkapan data: {liveCompleteness}%</div>
          </div>
        </div>
        <LoadingButton className="btn btn-md btn-primary" onClick={handleSave} loading={isSaving} loadingLabel="Menyimpan..."><Save size={16} /> Simpan Pemain</LoadingButton>
      </div>

      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <div style={{ gridColumn: 'span 12', padding: 14, border: '1px solid var(--neutral-200)', borderRadius: 8, background: 'var(--neutral-50)' }}>
            <label className="form-label">Cari Data Pemain dari API-Football</label>
            <div className="flex gap-8" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="form-input" style={{ flex: '1 1 260px' }} placeholder="Cari nama pemain..." value={apiSearch} onChange={event => setApiSearch(event.target.value)} />
              <input className="form-input" style={{ width: 96 }} placeholder="Season" value={apiSeason} onChange={event => setApiSeason(event.target.value.replace(/[^0-9]/g, '').slice(0, 4))} />
              <LoadingButton className="btn btn-sm btn-secondary" onClick={searchPlayersFromApi} loading={isSearchingApi} loadingLabel="Mencari...">Cari API</LoadingButton>
            </div>
            {apiPlayers.length > 0 && (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {apiPlayers.map(candidate => {
                  const stats = candidate.statistics?.[0];
                  return (
                    <button
                      key={`${candidate.player?.id}-${candidate.player?.name}-${stats?.team?.id || 'team'}`}
                      type="button"
                      onClick={() => applyApiPlayer(candidate)}
                      style={{ width: '100%', border: '1px solid var(--neutral-200)', background: 'var(--white)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                    >
                      {candidate.player?.photo && <img src={candidate.player.photo} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%' }} />}
                      <span style={{ flex: 1 }}>
                        <span className="semibold" style={{ display: 'block', fontSize: 13 }}>{candidate.player?.name}</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>
                          {candidate.player?.nationality || '-'}{stats?.team?.name ? ` - ${stats.team.name}` : ''}{stats?.games?.position ? ` - ${stats.games.position}` : ''}
                        </span>
                      </span>
                      <span className="badge badge-info">Terapkan</span>
                    </button>
                  );
                })}
              </div>
            )}
            <span className="form-helper">API hanya membantu mengisi profil dasar. Klub lokal tetap dipilih manual dari database Gosball.</span>
          </div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Nama Lengkap</label><input className="form-input" value={player.fullName} onChange={event => updatePlayer('fullName', event.target.value)} /></div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Display Name</label><input className="form-input" value={player.displayName} onChange={event => updatePlayer('displayName', event.target.value)} /></div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Klub</label><select className="form-select" value={player.clubId} onChange={event => updatePlayer('clubId', event.target.value)}>{clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}</select></div>
          <div style={{ gridColumn: 'span 3' }}><label className="form-label">Posisi</label><select className="form-select" value={player.position} onChange={event => updatePlayer('position', event.target.value as Player['position'])}><option value="Goalkeeper">Goalkeeper</option><option value="Defender">Defender</option><option value="Midfielder">Midfielder</option><option value="Forward">Forward</option></select></div>
          <div style={{ gridColumn: 'span 3' }}><label className="form-label">No</label><input type="number" className="form-input" value={player.shirtNumber} onChange={event => updatePlayer('shirtNumber', Number(event.target.value))} /></div>
          <div style={{ gridColumn: 'span 3' }}><label className="form-label">Umur</label><input type="number" className="form-input" value={player.age} onChange={event => updatePlayer('age', Number(event.target.value))} /></div>
          <div style={{ gridColumn: 'span 3' }}><label className="form-label">Status</label><select className="form-select" value={player.status} onChange={event => updatePlayer('status', event.target.value as Player['status'])}><option value="active">Aktif</option><option value="free_agent">Free Agent</option><option value="retired">Pensiun</option></select></div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Availability</label><select className="form-select" value={player.availability} onChange={event => updatePlayer('availability', event.target.value as Player['availability'])}><option value="available">Tersedia</option><option value="injured">Cedera</option><option value="suspended">Skorsing</option><option value="international_duty">Tim Nasional</option><option value="doubtful">Diragukan</option></select></div>
        </div>

        <aside className="card" style={{ gridColumn: 'span 4', position: 'relative' }}>
          <label className="form-label"><Search size={14} /> Negara / Kewarganegaraan</label>
          <button type="button" className="form-input" style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }} onClick={() => setDropdownOpen(prev => !prev)}>
            {player.flagUrl?.startsWith('http') && <img src={player.flagUrl} alt={player.nationality} style={{ width: 28, height: 18, objectFit: 'cover' }} />}
            {player.nationality || 'Pilih negara'}
          </button>
          {dropdownOpen && (
            <div style={{ position: 'absolute', left: 24, right: 24, top: 86, zIndex: 20, background: 'var(--surface)', border: '1px solid var(--neutral-200)', borderRadius: 8, boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ padding: 10, borderBottom: '1px solid var(--neutral-200)' }}>
                <input autoFocus className="form-input" placeholder="Cari negara..." value={countryQuery} onChange={event => setCountryQuery(event.target.value)} />
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {filteredCountries.map(country => (
                  <button
                    type="button"
                    key={country.name}
                    className="flex align-center gap-10"
                    style={{ width: '100%', padding: '8px 12px', border: 0, background: country.name === player.nationality ? 'var(--primary-50)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => {
                      updatePlayer('nationality', country.name);
                      updatePlayer('flagUrl', country.flagUrl);
                      setDropdownOpen(false);
                      setCountryQuery('');
                    }}
                  >
                    <img src={country.flagUrl} alt={country.name} style={{ width: 28, height: 18, objectFit: 'cover', borderRadius: 2 }} />
                    <span>{country.name}</span>
                    {country.name === player.nationality && <CheckCircle size={14} style={{ marginLeft: 'auto', color: 'var(--primary-600)' }} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
