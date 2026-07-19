'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Rumor } from '@/lib/mockData';
import { ArrowLeft, Save } from 'lucide-react';

export default function RumorEditorView({ rumorId }: { rumorId: string }) {
  const router = useRouter();
  const { clubs, rumors, setRumors, logAction, triggerToast } = useApp();
  const isNew = rumorId === 'new';
  const existing = rumors.find(item => item.id === rumorId);
  const base: Rumor = existing || {
    id: `rumor-${Date.now()}`,
    headline: '',
    player: '',
    fromClub: clubs[0]?.name || '',
    destinationClub: clubs[1]?.name || '',
    type: 'rumor',
    reliabilityTier: 'C',
    sourceName: '',
    sourceUrl: '',
    publicationStatus: 'Draft',
    transferStatus: 'Rumor',
    probability: 50,
    shortSummary: '',
    articleBody: '',
    author: 'Rumor Editor',
  };

  const [form, setForm] = useState<Rumor>(base);
  const updateForm = <K extends keyof Rumor>(key: K, value: Rumor[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.headline.trim() || !form.player.trim() || !form.sourceName.trim()) {
      triggerToast('Judul, nama pemain, dan sumber wajib diisi.', 'error');
      return;
    }

    setRumors(prev => isNew ? [form, ...prev] : prev.map(item => item.id === form.id ? form : item));
    logAction(isNew ? 'CREATE_RUMOR' : 'UPDATE_RUMOR', 'Rumor & Transfer', form.headline);
    triggerToast(isNew ? 'Rumor berhasil dibuat.' : 'Rumor berhasil disimpan.');
    router.push('/rumors');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={() => router.push('/rumors')}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>{isNew ? 'Tambah Rumor' : 'Edit Rumor'}</h1>
            <p className="page-description" style={{ marginTop: 4 }}>Konten editorial transfer dipisah dari route menu utama.</p>
          </div>
        </div>
        <button className="btn btn-md btn-primary" onClick={handleSave}>
          <Save size={16} /> Simpan Rumor
        </button>
      </div>

      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Headline <span className="required">*</span></label>
            <input className="form-input" value={form.headline} onChange={event => updateForm('headline', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ringkasan</label>
            <textarea className="form-textarea" rows={3} value={form.shortSummary} onChange={event => updateForm('shortSummary', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Isi Artikel</label>
            <textarea className="form-textarea" rows={8} value={form.articleBody} onChange={event => updateForm('articleBody', event.target.value)} />
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nama Pemain <span className="required">*</span></label>
            <input className="form-input" value={form.player} onChange={event => updateForm('player', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Klub Asal</label>
            <input className="form-input" value={form.fromClub} onChange={event => updateForm('fromClub', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Klub Tujuan</label>
            <input className="form-input" value={form.destinationClub} onChange={event => updateForm('destinationClub', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Reliability Tier</label>
            <select className="form-select" value={form.reliabilityTier} onChange={event => updateForm('reliabilityTier', event.target.value as Rumor['reliabilityTier'])}>
              <option value="A">Tier A</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
              <option value="D">Tier D</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status Publikasi</label>
            <select className="form-select" value={form.publicationStatus} onChange={event => updateForm('publicationStatus', event.target.value as Rumor['publicationStatus'])}>
              <option value="Draft">Draft</option>
              <option value="Review">Review</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Published">Published</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Probabilitas: {form.probability}%</label>
            <input type="range" min={0} max={100} value={form.probability} onChange={event => updateForm('probability', Number(event.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Sumber <span className="required">*</span></label>
            <input className="form-input" value={form.sourceName} onChange={event => updateForm('sourceName', event.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
