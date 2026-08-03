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
    team?: { id?: number; name?: string; logo?: string };
    games?: { number?: number; position?: string };
  }>;
};

const mapApiPosition = (position?: string): Player['position'] => {
  const n = (position || '').toLowerCase();
  if (n.includes('goalkeeper')) return 'Goalkeeper';
  if (n.includes('defender')) return 'Defender';
  if (n.includes('midfielder')) return 'Midfielder';
  if (n.includes('attacker') || n.includes('forward')) return 'Forward';
  return 'Midfielder';
};

export default function PlayerEditorView({ playerId, onClose }: { playerId: string; onClose: () => void }) {
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

  const selectedClub = clubs.find(c => c.id === player.clubId);
  const liveCompleteness = calculatePlayerCompleteness(player);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    return q ? countriesList.filter(c => c.name.toLowerCase().includes(q)) : countriesList;
  }, [countryQuery]);

  const updatePlayer = <K extends keyof Player>(key: K, value: Player[K]) =>
    setPlayer(prev => ({ ...prev, [key]: value }));

  const searchPlayersFromApi = async () => {
    const query = apiSearch.trim();
    if (query.length < 3) { triggerToast('Masukkan minimal 3 karakter.', 'warning'); return; }
    setIsSearchingApi(true);
    try {
      const params = new URLSearchParams({ resource: 'players', search: query, season: apiSeason || '2026' });
      const response = await fetch(`/api/integrations/api-football?${params.toString()}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Gagal mencari pemain dari API.');
      const candidates = Array.isArray(result.data?.response) ? result.data.response : [];
      setApiPlayers(candidates.slice(0, 8));
      triggerToast(`${candidates.length} kandidat ditemukan.`);
    } catch (err: any) {
      triggerToast(err.message || 'Gagal mencari pemain dari API.', 'error');
    } finally { setIsSearchingApi(false); }
  };

  const applyApiPlayer = (candidate: ApiPlayerCandidate) => {
    const ap = candidate.player || {};
    const fs = candidate.statistics?.[0];
    const nationality = ap.nationality || player.nationality;
    const country = countriesList.find(c => c.name.toLowerCase() === nationality.toLowerCase());
    setPlayer(prev => ({
      ...prev,
      fullName: ap.name || prev.fullName,
      displayName: ap.name || prev.displayName,
      age: Number(ap.age) || prev.age,
      nationality,
      flagUrl: country?.flagUrl || prev.flagUrl,
      position: mapApiPosition(fs?.games?.position),
      shirtNumber: Number(fs?.games?.number) || prev.shirtNumber,
    }));
    triggerToast('Data API diterapkan. Review lalu simpan.');
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!player.fullName.trim() || !player.displayName.trim()) {
      triggerToast('Nama lengkap dan display name wajib diisi.', 'error'); return;
    }
    setIsSaving(true);
    try {
      const saved = { ...player, clubName: selectedClub?.name || '', completeness: liveCompleteness };
      const result = await apiRequest('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', player: saved }),
      });
      if (!result.success) { triggerToast(`Gagal: ${result.error}`, 'error'); return; }
      setPlayers(prev => isNew ? [...prev, saved] : prev.map(p => p.id === saved.id ? saved : p));
      logAction(isNew ? 'CREATE_PLAYER' : 'UPDATE_PLAYER', 'Master Pemain', saved.fullName);
      triggerToast('Pemain berhasil disimpan.');
      onClose();
    } catch (err: any) {
      triggerToast(err.message || 'Kesalahan saat menyimpan.', 'error');
    } finally { setIsSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HEADER mobile-friendly ── */}
      <div style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 14, paddingRight: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            <ArrowLeft size={16} />
            <span style={{ marginLeft: 4 }}>Kembali</span>
          </button>
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isNew ? 'Tambah Pemain' : 'Edit Pemain'}
            </h1>
            <div className="text-muted" style={{ fontSize: 11 }}>Kelengkapan: {liveCompleteness}%</div>
          </div>
        </div>
        <LoadingButton
          className="btn btn-md btn-primary"
          onClick={handleSave}
          loading={isSaving}
          loadingLabel="Menyimpan..."
          style={{ width: '100%' }}
        >
          <Save size={16} /> Simpan Pemain
        </LoadingButton>
      </div>

      {/* ── API SEARCH ── */}
      <div className="card" style={{ padding: 16 }}>
        <label className="form-label">Cari Data Pemain dari API-Football</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="form-input"
            placeholder="Cari nama pemain..."
            value={apiSearch}
            onChange={e => setApiSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchPlayersFromApi()}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ width: 90, flexShrink: 0 }}
              placeholder="Season"
              value={apiSeason}
              onChange={e => setApiSeason(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <LoadingButton
              className="btn btn-sm btn-secondary"
              onClick={searchPlayersFromApi}
              loading={isSearchingApi}
              loadingLabel="Mencari..."
              style={{ flex: 1 }}
            >
              Cari API
            </LoadingButton>
          </div>
        </div>

        {apiPlayers.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {apiPlayers.map(candidate => {
              const stats = candidate.statistics?.[0];
              return (
                <button
                  key={`${candidate.player?.id}-${stats?.team?.id}`}
                  type="button"
                  onClick={() => applyApiPlayer(candidate)}
                  style={{ width: '100%', border: '1px solid var(--neutral-200)', background: 'var(--white)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                >
                  {candidate.player?.photo && (
                    <img src={candidate.player.photo} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="semibold" style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {candidate.player?.name}
                    </span>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      {candidate.player?.nationality || '-'}{stats?.team?.name ? ` · ${stats.team.name}` : ''}
                    </span>
                  </span>
                  <span className="badge badge-info" style={{ flexShrink: 0 }}>Terapkan</span>
                </button>
              );
            })}
          </div>
        )}
        <span className="form-helper" style={{ marginTop: 8, display: 'block' }}>
          API membantu isi profil dasar. Klub tetap dipilih manual.
        </span>
      </div>

      {/* ── FORM UTAMA ── */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nama Lengkap + Display Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Nama Lengkap</label>
              <input className="form-input" value={player.fullName} onChange={e => updatePlayer('fullName', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Display Name</label>
              <input className="form-input" value={player.displayName} onChange={e => updatePlayer('displayName', e.target.value)} />
            </div>
          </div>

          {/* Klub — full width */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Klub</label>
            <select className="form-select" value={player.clubId} onChange={e => updatePlayer('clubId', e.target.value)}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Posisi + No Punggung */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Posisi</label>
              <select className="form-select" value={player.position} onChange={e => updatePlayer('position', e.target.value as Player['position'])}>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">No Punggung</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={player.shirtNumber === 0 ? '' : player.shirtNumber}
                onChange={e => {
                  const v = e.target.value;
                  updatePlayer('shirtNumber', v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0));
                }}
              />
            </div>
          </div>

          {/* Umur + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Umur</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={player.age === 0 ? '' : player.age}
                onChange={e => {
                  const v = e.target.value;
                  updatePlayer('age', v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0));
                }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={player.status} onChange={e => updatePlayer('status', e.target.value as Player['status'])}>
                <option value="active">Aktif</option>
                <option value="free_agent">Free Agent</option>
                <option value="retired">Pensiun</option>
              </select>
            </div>
          </div>

          {/* Availability — full width */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Availability</label>
            <select className="form-select" value={player.availability} onChange={e => updatePlayer('availability', e.target.value as Player['availability'])}>
              <option value="available">Tersedia</option>
              <option value="injured">Cedera</option>
              <option value="suspended">Skorsing</option>
              <option value="international_duty">Tim Nasional</option>
              <option value="doubtful">Diragukan</option>
            </select>
          </div>

          {/* Negara / Kewarganegaraan */}
          <div className="form-group" style={{ margin: 0, position: 'relative' }}>
            <label className="form-label"><Search size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Negara / Kewarganegaraan</label>
            <button
              type="button"
              className="form-input"
              style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer' }}
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              {player.flagUrl?.startsWith('http') && (
                <img src={player.flagUrl} alt={player.nationality} style={{ width: 28, height: 18, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {player.nationality || 'Pilih negara'}
              </span>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4,
                zIndex: 50, background: 'var(--white)',
                border: '1px solid var(--neutral-200)', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
                <div style={{ padding: 10, borderBottom: '1px solid var(--neutral-100)' }}>
                  <input
                    autoFocus
                    className="form-input"
                    placeholder="Cari negara..."
                    value={countryQuery}
                    onChange={e => setCountryQuery(e.target.value)}
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {filteredCountries.map(country => (
                    <button
                      type="button"
                      key={country.name}
                      style={{
                        width: '100%', padding: '8px 12px', border: 0, cursor: 'pointer',
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                        background: country.name === player.nationality ? 'var(--primary-50)' : 'transparent',
                      }}
                      onClick={() => {
                        updatePlayer('nationality', country.name);
                        updatePlayer('flagUrl', country.flagUrl);
                        setDropdownOpen(false);
                        setCountryQuery('');
                      }}
                    >
                      <img src={country.flagUrl} alt={country.name} style={{ width: 28, height: 18, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13 }}>{country.name}</span>
                      {country.name === player.nationality && (
                        <CheckCircle size={14} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
