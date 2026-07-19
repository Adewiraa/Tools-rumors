'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { Club, calculateClubCompleteness } from '@/lib/mockData';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { generateUUID } from '@/logic/utils';
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

const buildClubCode = (name?: string, code?: string) => (
  (code || (name || '').split(/\s+/).map(part => part[0]).join('')).slice(0, 3).toUpperCase()
);

const mapApiTeamToClub = (baseClub: Club, candidate: ApiTeamCandidate): Club => {
  const nextName = candidate.team?.name || baseClub.name;

  return {
    ...baseClub,
    name: nextName,
    shortName: baseClub.shortName || nextName,
    code: buildClubCode(nextName, candidate.team?.code),
    city: candidate.venue?.city || baseClub.city,
    stadium: candidate.venue?.name || baseClub.stadium,
    logoUrl: candidate.team?.logo || baseClub.logoUrl,
  };
};

export default function ClubEditorView({ clubId }: { clubId: string }) {
  const { clubs, setClubs, competitions, logAction, triggerToast } = useApp();
  const isNew = clubId === 'new';
  const existing = clubs.find(item => item.id === clubId);
  const [club, setClub] = useState<Club>(existing || {
    id: generateUUID(),
    name: '',
    shortName: '',
    code: '',
    city: '',
    stadium: '',
    founded: 2026,
    homeColor: '#66756A',
    awayColor: '#E2E8F0',
    thirdColor: '#111827',
    logoUrl: '',
    coach: '',
    activePlayersCount: 0,
    completeness: 0,
    status: 'active',
    competitionIds: [],
  });
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiSearch, setApiSearch] = useState(existing?.name || '');
  const [apiTeams, setApiTeams] = useState<ApiTeamCandidate[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const updateClub = <K extends keyof Club>(key: K, value: Club[K]) => setClub(prev => ({ ...prev, [key]: value }));
  const goToClubsList = () => {
    window.location.replace('/clubs');
  };

  useEffect(() => {
    if (!isNew || typeof window === 'undefined') return;

    const rawDraft = window.sessionStorage.getItem('gosball_api_team_draft');
    if (!rawDraft) return;

    try {
      const candidate = JSON.parse(rawDraft) as ApiTeamCandidate;
      setClub(prev => mapApiTeamToClub(prev, candidate));
      setApiSearch(candidate.team?.name || '');
      triggerToast('Draft klub dari API dimuat. Review data sebelum disimpan.');
    } catch {
      triggerToast('Draft klub dari API tidak valid.', 'error');
    } finally {
      window.sessionStorage.removeItem('gosball_api_team_draft');
    }
  }, [isNew, triggerToast]);

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

  const applyApiTeam = (candidate: ApiTeamCandidate) => {
    setClub(prev => mapApiTeamToClub(prev, candidate));
    triggerToast('Data klub dari API diterapkan ke form. Review lalu simpan manual.');
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'club-logos');
      formData.append('folder', club.code.toLowerCase() || 'club');
      const response = await fetch('/api/uploads/logo', { method: 'POST', body: formData });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload gagal');
      updateClub('logoUrl', result.data.publicUrl);
    } catch (error: any) {
      triggerToast(error.message || 'Upload logo gagal.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!club.name.trim() || !club.shortName.trim() || !club.code.trim()) {
      triggerToast('Nama, short name, dan kode klub wajib diisi.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const savedClub = { ...club, completeness: calculateClubCompleteness(club) };
      const saveClubResult = await apiRequest('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club: savedClub }),
      });

      if (!saveClubResult.success) {
        triggerToast(`Gagal menyimpan klub: ${saveClubResult.error}`, 'error');
        return;
      }

      const saveCompetitionsResult = await apiRequest('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_club_competitions',
          clubId: savedClub.id,
          competitionIds: savedClub.competitionIds || [],
        }),
      });

      if (!saveCompetitionsResult.success) {
        triggerToast(`Klub tersimpan, tapi relasi kompetisi gagal: ${saveCompetitionsResult.error}`, 'warning');
      }

      setClubs(prev => isNew ? [...prev, savedClub] : prev.map(item => item.id === savedClub.id ? savedClub : item));
      logAction(isNew ? 'CREATE_CLUB' : 'UPDATE_CLUB', 'Master Klub', savedClub.name);
      triggerToast('Klub berhasil disimpan.');
      goToClubsList();
    } catch (error: any) {
      triggerToast(error.message || 'Terjadi kesalahan saat menyimpan klub.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button type="button" className="btn btn-sm btn-secondary" onClick={goToClubsList}><ArrowLeft size={16} /> Kembali</button>
          <h1 className="page-title" style={{ margin: 0 }}>{isNew ? 'Tambah Klub' : 'Edit Klub'}</h1>
        </div>
        <LoadingButton className="btn btn-md btn-primary" onClick={handleSave} loading={isSaving} loadingLabel="Menyimpan..."><Save size={16} /> Simpan Klub</LoadingButton>
      </div>

      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <div style={{ gridColumn: 'span 12', padding: 14, border: '1px solid var(--neutral-200)', borderRadius: 8, background: 'var(--neutral-50)' }}>
            <label className="form-label">Cari Data Klub dari API-Football</label>
            <div className="flex gap-8" style={{ alignItems: 'center' }}>
              <input className="form-input" placeholder="Cari nama klub..." value={apiSearch} onChange={event => setApiSearch(event.target.value)} />
              <LoadingButton className="btn btn-sm btn-secondary" onClick={searchTeamsFromApi} loading={isSearchingApi} loadingLabel="Mencari...">Cari API</LoadingButton>
            </div>
            {apiTeams.length > 0 && (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {apiTeams.map(candidate => (
                  <button
                    key={`${candidate.team?.id}-${candidate.team?.name}`}
                    type="button"
                    onClick={() => applyApiTeam(candidate)}
                    style={{ width: '100%', border: '1px solid var(--neutral-200)', background: 'var(--white)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    {candidate.team?.logo && <img src={candidate.team.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
                    <span style={{ flex: 1 }}>
                      <span className="semibold" style={{ display: 'block', fontSize: 13 }}>{candidate.team?.name}</span>
                      <span className="text-muted" style={{ fontSize: 11 }}>{candidate.team?.country || '-'}{candidate.venue?.name ? ` - ${candidate.venue.name}` : ''}</span>
                    </span>
                    <span className="badge badge-info">Terapkan</span>
                  </button>
                ))}
              </div>
            )}
            <span className="form-helper">API hanya membantu mengisi logo/nama/stadion. Data final tetap dari tombol Simpan Klub.</span>
          </div>
          <div style={{ gridColumn: 'span 8' }}><label className="form-label">Nama Klub</label><input className="form-input" value={club.name} onChange={event => updateClub('name', event.target.value)} /></div>
          <div style={{ gridColumn: 'span 4' }}><label className="form-label">Kode</label><input className="form-input" value={club.code} maxLength={3} onChange={event => updateClub('code', event.target.value.toUpperCase())} /></div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Short Name</label><input className="form-input" value={club.shortName} onChange={event => updateClub('shortName', event.target.value)} /></div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Pelatih</label><input className="form-input" value={club.coach} onChange={event => updateClub('coach', event.target.value)} /></div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Kota</label><input className="form-input" value={club.city} onChange={event => updateClub('city', event.target.value)} /></div>
          <div style={{ gridColumn: 'span 6' }}><label className="form-label">Stadion</label><input className="form-input" value={club.stadium} onChange={event => updateClub('stadium', event.target.value)} /></div>
        </div>

        <aside className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Logo Klub</label>
            <div className="flex align-center gap-12">
              <div style={{ width: 58, height: 58, border: '1px solid var(--neutral-200)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {club.logoUrl?.startsWith('http') ? <img src={club.logoUrl} alt={club.name} style={{ width: 50, height: 50, objectFit: 'contain' }} /> : <span>{club.logoUrl || '-'}</span>}
              </div>
              <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> {uploading ? 'Mengunggah...' : 'Upload'}
                <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
          <div>
            <label className="form-label">Kompetisi</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {competitions.map(comp => (
                <label key={comp.id} className="flex align-center gap-8" style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={(club.competitionIds || []).includes(comp.id)}
                    onChange={() => updateClub('competitionIds', (club.competitionIds || []).includes(comp.id) ? (club.competitionIds || []).filter(id => id !== comp.id) : [...(club.competitionIds || []), comp.id])}
                  />
                  {comp.name}
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
