'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Club, calculateClubCompleteness } from '@/lib/mockData';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { generateUUID } from '@/logic/utils';

export default function ClubEditorView({ clubId }: { clubId: string }) {
  const router = useRouter();
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

  const updateClub = <K extends keyof Club>(key: K, value: Club[K]) => setClub(prev => ({ ...prev, [key]: value }));

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

  const handleSave = () => {
    if (!club.name.trim() || !club.shortName.trim() || !club.code.trim()) {
      triggerToast('Nama, short name, dan kode klub wajib diisi.', 'error');
      return;
    }
    const savedClub = { ...club, completeness: calculateClubCompleteness(club) };
    setClubs(prev => isNew ? [...prev, savedClub] : prev.map(item => item.id === savedClub.id ? savedClub : item));
    logAction(isNew ? 'CREATE_CLUB' : 'UPDATE_CLUB', 'Master Klub', savedClub.name);
    triggerToast('Klub berhasil disimpan.');
    router.push('/clubs');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={() => router.push('/clubs')}><ArrowLeft size={16} /> Kembali</button>
          <h1 className="page-title" style={{ margin: 0 }}>{isNew ? 'Tambah Klub' : 'Edit Klub'}</h1>
        </div>
        <button className="btn btn-md btn-primary" onClick={handleSave}><Save size={16} /> Simpan Klub</button>
      </div>

      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
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
          <div className="grid-12" style={{ gap: 10 }}>
            {(['homeColor', 'awayColor', 'thirdColor'] as const).map(key => (
              <div key={key} style={{ gridColumn: 'span 12' }}>
                <label className="form-label">{key === 'homeColor' ? 'Home Color' : key === 'awayColor' ? 'Away Color' : 'Third Color'}</label>
                <div className="flex gap-8">
                  <input type="color" value={club[key]} onChange={event => updateClub(key, event.target.value)} />
                  <input className="form-input" value={club[key]} onChange={event => updateClub(key, event.target.value)} />
                </div>
              </div>
            ))}
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
