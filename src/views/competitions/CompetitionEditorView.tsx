'use client';

import React, { useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { Competition } from '@/lib/mockData';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { generateUUID } from '@/logic/utils';
import { apiRequest } from '@/logic/apiClient';
import LoadingButton from '@/views/shared/LoadingButton';

const slugify = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function CompetitionEditorView({ competitionId }: { competitionId: string }) {
  const { competitions, setCompetitions, logAction, triggerToast } = useApp();
  const isNew = competitionId === 'new';
  const existing = competitions.find(item => item.id === competitionId);
  const [competition, setCompetition] = useState<Competition>(existing || {
    id: generateUUID(),
    name: '',
    shortName: '',
    slug: '',
    type: 'league',
    country: 'Indonesia',
    logoUrl: '',
    season: '2026/27',
    isActive: true,
    foreignRegulationFree: false,
    maxForeignStarters: 7,
    maxForeignMatchday: 9,
    maxForeignSquad: 11,
    minLocalStarters: 0,
    minLocalMatchday: 0,
    isInternational: false,
  });
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const updateCompetition = <K extends keyof Competition>(key: K, value: Competition[K]) => setCompetition(prev => ({ ...prev, [key]: value }));
  const goToCompetitionsList = () => {
    window.location.replace('/competitions');
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'competition-logos');
      formData.append('folder', competition.slug || slugify(competition.name) || 'competition');
      const response = await fetch('/api/uploads/logo', { method: 'POST', body: formData });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload gagal');
      updateCompetition('logoUrl', result.data.publicUrl);
    } catch (error: any) {
      triggerToast(error.message || 'Upload logo gagal.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!competition.name.trim()) {
      triggerToast('Nama kompetisi wajib diisi.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      // Auto-generate shortName if empty
      const finalShortName = competition.shortName.trim() || competition.name
        .split(/\s+/)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 8);

      const savedCompetition = {
        ...competition,
        shortName: finalShortName,
        slug: competition.slug || slugify(competition.name),
        // If international, bypass regulation
        ...(competition.isInternational ? {
          foreignRegulationFree: true,
          maxForeignStarters: 0,
          maxForeignMatchday: 0,
          maxForeignSquad: 0,
          minLocalStarters: 0,
          minLocalMatchday: 0,
        } : {}),
      };
      const result = await apiRequest('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', competition: savedCompetition }),
      });

      if (!result.success) {
        triggerToast(`Gagal menyimpan kompetisi: ${result.error}`, 'error');
        return;
      }

      setCompetitions(prev => isNew ? [...prev, savedCompetition] : prev.map(item => item.id === savedCompetition.id ? savedCompetition : item));
      logAction(isNew ? 'CREATE_COMPETITION' : 'UPDATE_COMPETITION', 'Master Kompetisi', savedCompetition.name);
      triggerToast('Kompetisi berhasil disimpan.');
      goToCompetitionsList();
    } catch (error: any) {
      triggerToast(error.message || 'Terjadi kesalahan saat menyimpan kompetisi.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button type="button" className="btn btn-sm btn-secondary" onClick={goToCompetitionsList}><ArrowLeft size={16} /> Kembali</button>
          <h1 className="page-title" style={{ margin: 0 }}>{isNew ? 'Tambah Kompetisi' : 'Edit Kompetisi'}</h1>
        </div>
        <LoadingButton className="btn btn-md btn-primary" onClick={handleSave} loading={isSaving} loadingLabel="Menyimpan..."><Save size={16} /> Simpan Kompetisi</LoadingButton>
      </div>

      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <div style={{ gridColumn: 'span 8' }}><label className="form-label">Nama Kompetisi</label><input className="form-input" value={competition.name} onChange={event => { updateCompetition('name', event.target.value); if (isNew) updateCompetition('slug', slugify(event.target.value)); }} /></div>
          <div style={{ gridColumn: 'span 4' }}><label className="form-label">Kode <span style={{ fontSize: 10, color: 'var(--neutral-400)', fontWeight: 400 }}>(Opsional)</span></label><input className="form-input" value={competition.shortName} maxLength={8} onChange={event => updateCompetition('shortName', event.target.value.toUpperCase())} /></div>
          <div style={{ gridColumn: 'span 12' }}><label className="form-label">Slug</label><input className="form-input" value={competition.slug} onChange={event => updateCompetition('slug', slugify(event.target.value))} /></div>
          <div style={{ gridColumn: 'span 3' }}><label className="form-label">Tipe</label><select className="form-select" value={competition.type} onChange={event => updateCompetition('type', event.target.value as Competition['type'])}><option value="league">Liga</option><option value="cup">Piala</option><option value="friendly">Friendly</option></select></div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label">Level Kompetisi</label>
            <select className="form-select" value={competition.isInternational ? 'international' : 'club'} onChange={event => updateCompetition('isInternational', event.target.value === 'international')}>
              <option value="club">Klub</option>
              <option value="international">Internasional (Negara)</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}><label className="form-label">Negara / Zona</label><input className="form-input" value={competition.country} onChange={event => updateCompetition('country', event.target.value)} /></div>
          <div style={{ gridColumn: 'span 3' }}><label className="form-label">Musim</label><input className="form-input" value={competition.season} onChange={event => updateCompetition('season', event.target.value)} /></div>
          
          {!competition.isInternational && (
            <div style={{ gridColumn: 'span 12', borderTop: '1px solid var(--neutral-200)', paddingTop: 14 }}>
              <div className="semibold" style={{ fontSize: 13, marginBottom: 10 }}>Regulasi Lineup</div>
              <label className="flex align-center gap-8" style={{ cursor: 'pointer', gridColumn: 'span 12', marginBottom: 12, padding: '10px 12px', border: '1px solid var(--neutral-200)', borderRadius: 8, background: competition.foreignRegulationFree ? '#eef7f0' : 'var(--neutral-50)' }}>
                <input type="checkbox" checked={Boolean(competition.foreignRegulationFree)} onChange={event => updateCompetition('foreignRegulationFree', event.target.checked)} />
                <span>
                  <span className="semibold" style={{ display: 'block', fontSize: 13 }}>Bebaskan batas pemain asing</span>
                  <span className="text-muted" style={{ display: 'block', fontSize: 11 }}>Tidak ada batas didaftarkan, starting XI, dan dibawa pertandingan.</span>
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12 }}>
                <div style={{ gridColumn: 'span 4' }}>
                  <label className="form-label">Maks Asing Starting XI</label>
                  <input className="form-input" type="number" min={0} max={11} disabled={Boolean(competition.foreignRegulationFree)} value={competition.maxForeignStarters ?? 7} onChange={event => updateCompetition('maxForeignStarters', Number(event.target.value))} />
                </div>
                <div style={{ gridColumn: 'span 4' }}>
                  <label className="form-label">Maks Asing Dibawa</label>
                  <input className="form-input" type="number" min={0} max={26} disabled={Boolean(competition.foreignRegulationFree)} value={competition.maxForeignMatchday ?? 9} onChange={event => updateCompetition('maxForeignMatchday', Number(event.target.value))} />
                </div>
                <div style={{ gridColumn: 'span 4' }}>
                  <label className="form-label">Maks Asing DSP Liga</label>
                  <input className="form-input" type="number" min={0} max={99} disabled={Boolean(competition.foreignRegulationFree)} value={competition.maxForeignSquad ?? 11} onChange={event => updateCompetition('maxForeignSquad', Number(event.target.value))} />
                </div>
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="form-label">Min Lokal Starting XI</label>
                  <input className="form-input" type="number" min={0} max={11} value={competition.minLocalStarters ?? 0} onChange={event => updateCompetition('minLocalStarters', Number(event.target.value))} />
                </div>
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="form-label">Min Lokal Dibawa</label>
                  <input className="form-input" type="number" min={0} max={26} value={competition.minLocalMatchday ?? 0} onChange={event => updateCompetition('minLocalMatchday', Number(event.target.value))} />
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="flex align-center gap-8" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={competition.isActive} onChange={event => updateCompetition('isActive', event.target.checked)} />
            Kompetisi aktif
          </label>
          <div>
            <label className="form-label">Logo Kompetisi</label>
            <div className="flex align-center gap-12">
              <div style={{ width: 58, height: 58, border: '1px solid var(--neutral-200)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {competition.logoUrl?.startsWith('http') ? <img src={competition.logoUrl} alt={competition.name} style={{ width: 50, height: 50, objectFit: 'contain' }} /> : '-'}
              </div>
              <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> {uploading ? 'Mengunggah...' : 'Upload'}
                <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
