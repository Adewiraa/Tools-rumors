'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/logic/AppContext';
import { Match } from '@/lib/mockData';
import { ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { getEditableScheduleStatus } from '@/logic/utils';
import LoadingButton from '@/views/shared/LoadingButton';
import SearchableClubSelect from '@/views/shared/SearchableClubSelect';
import { Button, Card, Input, Select } from '@/components/ui';

export default function ScheduleEditorView({ matchId }: { matchId: string }) {
  const {
    clubs,
    competitions,
    matches,
    setMatches,
    logAction,
    triggerToast
  } = useApp();

  const isNew = matchId === 'new';
  const existing = matches.find(m => m.id === matchId);
  const firstComp = competitions.find(c => c.isActive) || competitions[0];

  const [competition, setCompetition] = useState(existing?.competition || firstComp?.name || '');
  const [homeClubId, setHomeClubId]   = useState(existing?.homeClubId || clubs[0]?.id || '');
  const [awayClubId, setAwayClubId]   = useState(existing?.awayClubId || (clubs[1]?.id || ''));
  const [kickoff, setKickoff]         = useState(existing?.kickoff ? existing.kickoff.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [venue, setVenue]             = useState(existing?.venue || '');
  const [status, setStatus]           = useState<Match['status']>(getEditableScheduleStatus(existing));
  const [isSaving, setIsSaving]       = useState(false);
  
  const selectedCompetition = competitions.find(c => c.name === competition);
  const eligibleClubs = selectedCompetition ? clubs.filter(c => c.competitionIds?.includes(selectedCompetition.id)) : clubs;
  const clubOptions = eligibleClubs.length >= 2 ? eligibleClubs : clubs;

  const goToScheduleList = () => {
    window.location.replace('/schedule');
  };

  useEffect(() => {
    if (!existing?.venue) {
      const hc = clubs.find(c => c.id === homeClubId);
      if (hc?.stadium) setVenue(hc.stadium);
    }
  }, [homeClubId]);

  const handleSave = async () => {
    if (isSaving) return;
    if (!homeClubId || !awayClubId) { triggerToast('Pilih kedua tim.', 'error'); return; }
    if (homeClubId === awayClubId) { triggerToast('Tim home dan away tidak boleh sama.', 'error'); return; }
    if (!kickoff) { triggerToast('Isi tanggal kickoff.', 'error'); return; }
    
    const hc = clubs.find(c => c.id === homeClubId);
    const ac = clubs.find(c => c.id === awayClubId);
    const comp = competitions.find(c => c.name === competition);
    
    const updatedMatch: Match = {
      ...(existing || {}),
      id: existing?.id || ('match-' + Date.now()),
      homeClubId, homeClubName: hc?.name || '', homeLogo: hc?.logoUrl || '',
      awayClubId,  awayClubName: ac?.name || '', awayLogo: ac?.logoUrl || '',
      competition, season: comp?.season || '',
      kickoff: new Date(kickoff).toISOString(), venue, status,
      homeScore: existing?.homeScore, awayScore: existing?.awayScore,
      halfTimeHomeScore: existing?.halfTimeHomeScore, halfTimeAwayScore: existing?.halfTimeAwayScore,
      lineupStatus: existing?.lineupStatus || 'Draft',
      publicationStatus: existing?.publicationStatus || 'Draft',
      timeline: existing?.timeline || [],
      editor: 'Admin', lastUpdated: 'Baru saja',
    };

    try {
      setIsSaving(true);
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', match: updatedMatch })
      });
      const result = await res.json();
      if (!result.success) {
        triggerToast(`Gagal menyimpan jadwal: ${result.error}`, 'error');
        return;
      }

      if (isNew) {
        setMatches(prev => [...prev, updatedMatch]);
        logAction('CREATE_SCHEDULE', 'Jadwal Pertandingan', `Menambah jadwal baru: ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
        triggerToast('Jadwal baru berhasil ditambahkan!');
      } else {
        setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
        logAction('UPDATE_SCHEDULE', 'Jadwal Pertandingan', `Memperbarui jadwal: ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
        triggerToast('Jadwal berhasil diperbarui!');
      }
      goToScheduleList();
    } catch (err: any) {
      triggerToast('Terjadi kesalahan saat menyimpan jadwal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const homeClub = clubs.find(c => c.id === homeClubId);
  const awayClub = clubs.find(c => c.id === awayClubId);
  const handleCompetitionChange = (nextName: string) => {
    setCompetition(nextName);
    const nextComp = competitions.find(c => c.name === nextName);
    const nextEligible = nextComp ? clubs.filter(c => c.competitionIds?.includes(nextComp.id)) : clubs;
    const nextOptions = nextEligible.length >= 2 ? nextEligible : clubs;
    if (nextOptions.length > 0) {
      const nextHome = nextOptions[0];
      const nextAway = nextOptions.find(c => c.id !== nextHome.id);
      setHomeClubId(nextHome.id);
      if (nextAway) setAwayClubId(nextAway.id);
      if (nextHome.stadium) setVenue(nextHome.stadium);
    }
  };

  return (
    <div className="schedule-editor-container">
      <div className="schedule-editor-header">
        <div className="schedule-editor-header-left">
          <Button type="button" size="sm" variant="secondary" className="schedule-editor-back-btn" onClick={goToScheduleList}>
            <ArrowLeft size={16} /> Kembali
          </Button>
          <div>
            <div className="breadcrumb"><span>Jadwal</span> <ChevronRight size={10} /> <span>{isNew ? 'Tambah Jadwal' : 'Edit Jadwal'}</span></div>
            <h2 className="schedule-editor-title">{isNew ? 'Tambah Jadwal Baru' : `Edit: ${existing?.homeClubName} vs ${existing?.awayClubName}`}</h2>
          </div>
        </div>
        <LoadingButton className="btn btn-md btn-primary schedule-editor-save-btn" onClick={handleSave} loading={isSaving} loadingLabel="Menyimpan...">
          <CheckCircle size={14} /> {isNew ? 'Simpan Jadwal' : 'Update Jadwal'}
        </LoadingButton>
      </div>

      <Card className="schedule-editor-card">
        <Select label="Kompetisi" required value={competition} onChange={e => handleCompetitionChange(e.target.value)} helper={eligibleClubs.length >= 2 ? `${eligibleClubs.length} klub peserta tersedia untuk kompetisi ini.` : 'Belum ada relasi peserta, semua klub ditampilkan.'}>
          {competitions.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} ({c.season})</option>)}
          {competitions.filter(c => !c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} (nonaktif)</option>)}
        </Select>

        <div className="schedule-editor-form-grid">
          <div className="form-row-2col schedule-editor-team-fields">
            <div className="form-group">
              <label className="form-label">Tim Home <span className="required">*</span></label>
              <SearchableClubSelect
                clubs={clubOptions}
                value={homeClubId}
                onChange={id => setHomeClubId(id)}
                placeholder="Pilih Tim Home..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tim Away <span className="required">*</span></label>
              <SearchableClubSelect
                clubs={clubOptions}
                value={awayClubId}
                onChange={id => setAwayClubId(id)}
                placeholder="Pilih Tim Away..."
              />
            </div>
          </div>

          {homeClubId && awayClubId && homeClubId !== awayClubId && (
            <div className="schedule-matchup-preview">
              <div className="schedule-matchup-team">
                {homeClub?.logoUrl && homeClub.logoUrl.startsWith('http')
                  ? <img src={homeClub.logoUrl} alt="" className="schedule-matchup-logo" />
                  : <div className="schedule-matchup-logo-placeholder">{homeClub?.logoUrl || 'H'}</div>}
                <div className="schedule-matchup-name">{homeClub?.shortName}</div>
              </div>
              <div className="schedule-matchup-vs">VS</div>
              <div className="schedule-matchup-team">
                {awayClub?.logoUrl && awayClub.logoUrl.startsWith('http')
                  ? <img src={awayClub.logoUrl} alt="" className="schedule-matchup-logo" />
                  : <div className="schedule-matchup-logo-placeholder">{awayClub?.logoUrl || 'A'}</div>}
                <div className="schedule-matchup-name">{awayClub?.shortName}</div>
              </div>
            </div>
          )}

          <Input label="Tanggal & Waktu Kickoff" required type="datetime-local" value={kickoff} onChange={e => setKickoff(e.target.value)} />
          {status === 'Finished' ? (
            <Input label="Status Pertandingan" value="Selesai" disabled readOnly helper="Live otomatis saat tanggal kickoff masuk hari pertandingan." />
          ) : (
            <Select label="Status Pertandingan" value={status} onChange={e => setStatus(e.target.value as Match['status'])} helper="Live otomatis saat tanggal kickoff masuk hari pertandingan.">
              <option value="Scheduled">Dijadwalkan</option>
              <option value="Postponed">Ditunda</option>
              <option value="Cancelled">Dibatalkan</option>
            </Select>
          )}

          <Input label="Venue / Stadion" helper="(auto dari home club)" type="text" placeholder="Nama stadion..." value={venue} onChange={e => setVenue(e.target.value)} />

          <div className="schedule-editor-summary">
            <span>Flow Jadwal</span>
            <strong>{homeClub?.shortName || 'Home'} vs {awayClub?.shortName || 'Away'}</strong>
            <p>{competition || 'Kompetisi'} - {venue || 'Venue belum diisi'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
