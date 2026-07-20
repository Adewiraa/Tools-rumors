'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Rumor } from '@/lib/mockData';
import { APP_LOGO_SRC } from '@/logic/utils';
import { ArrowLeft, Download, Image as ImageIcon, Save, Share2, Upload } from 'lucide-react';
import LoadingButton from '@/views/shared/LoadingButton';
import * as htmlToImage from 'html-to-image';

const GRAPHIC_ID = 'rumor-transfer-graphic';

const buildFileName = (rumor: Rumor) =>
  `Rumor_${rumor.player || 'Pemain'}_${rumor.destinationClub || 'Klub'}.png`.replace(/[^\w.-]+/g, '_');

const getImageAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
  reader.readAsDataURL(file);
});

type ShareNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

const getErrorMessage = (err: unknown, fallback: string) => (
  err instanceof Error && err.message ? err.message : fallback
);

export default function RumorEditorView({ rumorId }: { rumorId: string }) {
  const router = useRouter();
  const { clubs, rumors, setRumors, logAction, triggerToast } = useApp();
  const [draftId] = useState(() => `rumor-${Date.now()}`);
  const isNew = rumorId === 'new';
  const existing = rumors.find(item => item.id === rumorId);

  const base: Rumor = existing || {
    id: draftId,
    headline: '',
    player: '',
    fromClub: '',
    destinationClub: '',
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
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ── Posisi foto (seperti match result) ────────────────────────────────────
  const [posX, setPosX] = useState(base.playerImagePositionX ?? 50);
  const [posY, setPosY] = useState(base.playerImagePositionY ?? 20);
  const [zoom, setZoom] = useState(base.playerImageZoom ?? 100);

  const update = <K extends keyof Rumor>(key: K, value: Rumor[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const destClub = clubs.find(c =>
    c.name.trim().toLowerCase() === form.destinationClub.trim().toLowerCase() ||
    c.shortName.trim().toLowerCase() === form.destinationClub.trim().toLowerCase()
  );

  const caption = (form.shortSummary || form.graphicCaption || form.headline || '').trim();

  const buildSaved = (): Rumor => ({
    ...form,
    headline: form.player && form.destinationClub
      ? `${form.player} diminati ${form.destinationClub}`
      : form.headline,
    fromClub: form.fromClub || 'Belum diketahui',
    type: 'rumor',
    reliabilityTier: 'C',
    sourceName: form.sourceName || 'Media Tools',
    publicationStatus: form.publicationStatus || 'Draft',
    transferStatus: 'Rumor',
    probability: 50,
    shortSummary: caption,
    articleBody: caption,
    graphicCaption: caption,
    playerImagePositionX: posX,
    playerImagePositionY: posY,
    playerImageZoom: zoom,
    author: form.author || 'Rumor Editor',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { triggerToast('File harus berupa gambar.', 'error'); return; }
    try {
      const dataUrl = await getImageAsDataUrl(file);
      update('playerImageUrl', dataUrl);
      setPosX(50);
      setPosY(20);
      setZoom(100);
      triggerToast('Foto pemain diterapkan ke preview.');
    } catch (err: unknown) { triggerToast(getErrorMessage(err, 'Gagal membaca gambar.'), 'error'); }
    finally { e.target.value = ''; }
  };

  const exportGraphic = async () => {
    const node = document.getElementById(GRAPHIC_ID);
    if (!node) throw new Error('Preview tidak ditemukan.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const blob = await (await fetch(dataUrl)).blob();
    return { dataUrl, blob, fileName: buildFileName(buildSaved()) };
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      triggerToast('Mengunduh gambar...');
      const { dataUrl, fileName } = await exportGraphic();
      const a = document.createElement('a');
      a.download = fileName; a.href = dataUrl; a.click();
      triggerToast('Gambar berhasil diunduh.');
    } catch (err: unknown) { triggerToast(getErrorMessage(err, 'Gagal mengunduh.'), 'error'); }
    finally { setIsExporting(false); }
  };

  const handleShare = async () => {
    try {
      setIsExporting(true);
      triggerToast('Membuat gambar...');
      const { blob, dataUrl, fileName } = await exportGraphic();
      const saved = buildSaved();
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as ShareNavigator;
      const shareData: ShareData = { files: [file], title: saved.headline, text: caption };
      if (typeof nav.share === 'function' && nav.canShare?.(shareData)) {
        await nav.share(shareData);
        triggerToast('Siap dibagikan.');
      } else {
        const a = document.createElement('a');
        a.download = fileName; a.href = dataUrl; a.click();
        triggerToast('Share tidak didukung, PNG diunduh.', 'warning');
      }
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : '';
      if (errorName !== 'AbortError') triggerToast(getErrorMessage(err, 'Gagal.'), 'error');
    } finally { setIsExporting(false); }
  };

  const returnToRumorsList = () => {
    setIsSaving(false);
    router.replace('/rumors');
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!form.player.trim() || !form.destinationClub.trim() || !caption || !form.playerImageUrl?.trim()) {
      triggerToast('Foto pemain, nama pemain, klub peminat, dan caption wajib diisi.', 'error');
      return;
    }
    try {
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 300));
      const saved = buildSaved();
      setRumors(prev => isNew ? [saved, ...prev] : prev.map(r => r.id === saved.id ? saved : r));
      logAction(isNew ? 'CREATE_RUMOR' : 'UPDATE_RUMOR', 'Rumor & Transfer', saved.headline);
      triggerToast(isNew ? 'Rumor berhasil dibuat.' : 'Rumor berhasil disimpan.');
      setIsSaving(false);
      router.replace('/rumors');
    } catch (err: unknown) {
      setIsSaving(false);
      triggerToast(getErrorMessage(err, 'Gagal menyimpan rumor.'), 'error');
    }
  };

  // ── GRAPHIC 9:16 ─────────────────────────────────────────────────────────
  const graphicCard = (
    <div
      id={GRAPHIC_ID}
      style={{
        width: 360,
        height: 640,
        background: '#0a0a0a',
        color: 'white',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
      }}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', flexShrink: 0, zIndex: 5 }} />

      {/* ── FOTO PEMAIN FULL (72%) ── */}
      <div style={{ position: 'relative', flex: '0 0 72%', overflow: 'hidden' }}>
        {form.playerImageUrl ? (
          <img
            src={form.playerImageUrl}
            crossOrigin="anonymous"
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${posX}% ${posY}%`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: `${posX}% ${posY}%`,
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #111, #1f1f1f)', display: 'grid', placeItems: 'center', color: '#444' }}>
            <div style={{ textAlign: 'center' }}>
              <ImageIcon size={48} />
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, marginTop: 10, textTransform: 'uppercase' }}>Upload Foto Pemain</div>
            </div>
          </div>
        )}

        {/* Gradient bawah */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.55) 55%, transparent 100%)', zIndex: 1 }} />
        {/* Gradient atas */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)', zIndex: 1 }} />

        {/* TRANSFER WATCH badge — top left */}
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 3 }}>
          <div style={{ padding: '5px 11px', background: '#c8a84b', borderRadius: 5 }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: '#0a0a0a', letterSpacing: 1.5, textTransform: 'uppercase' }}>TRANSFER WATCH</span>
          </div>
        </div>

        {/* LOGO KLUB — top right, TRANSPARAN (tidak ada badge putih) */}
        {destClub?.logoUrl && destClub.logoUrl.startsWith('http') && (
          <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 3 }}>
            <img
              src={destClub.logoUrl}
              crossOrigin="anonymous"
              alt=""
              style={{ width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}
            />
          </div>
        )}

        {/* Nama pemain — bottom foto */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: '0 16px 14px' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#c8a84b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
            Target Player
          </div>
          <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: -0.5, textTransform: 'uppercase', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
            {form.player || <span style={{ color: '#444' }}>Nama Pemain</span>}
          </div>
        </div>
      </div>

      {/* ── CAPTION SECTION (28%) ── */}
      <div style={{ flex: '1 1 auto', background: '#0a0a0a', borderTop: '1px solid rgba(200,168,75,0.25)', display: 'flex', flexDirection: 'column', padding: '13px 16px 10px' }}>

        {/* Diminati oleh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#666', letterSpacing: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Diminati Oleh</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(200,168,75,0.2)' }} />
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.3 }}>
            {destClub?.shortName || form.destinationClub || <span style={{ color: '#333' }}>Klub Tujuan</span>}
          </div>
        </div>

        {/* Caption */}
        <div style={{ flex: 1, fontSize: 12, lineHeight: 1.5, color: '#d1d5db', fontWeight: 400 }}>
          {caption || <span style={{ color: '#333' }}>Caption akan muncul di sini...</span>}
        </div>

        {/* Brand logo */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 }}>
          <img
            src={APP_LOGO_SRC}
            crossOrigin="anonymous"
            alt="Media Tools"
            style={{ height: 24, objectFit: 'contain', opacity: 0.9, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))' }}
          />
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', flexShrink: 0 }} />
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button type="button" className="btn btn-sm btn-secondary" onClick={returnToRumorsList}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>{isNew ? 'Tambah Rumor' : 'Edit Rumor'}</h1>
            <p className="page-description" style={{ marginTop: 4 }}>
              Upload foto pemain, atur posisi, pilih klub peminat, tulis caption.
            </p>
          </div>
        </div>
        <LoadingButton className="btn btn-md btn-primary" onClick={handleSave} loading={isSaving} loadingLabel="Menyimpan...">
          <Save size={16} /> Simpan Rumor
        </LoadingButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start' }}>

        {/* ── FORM ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Upload foto */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Foto Pemain</div>
            {form.playerImageUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={form.playerImageUrl} alt="" style={{ width: 60, height: 76, objectFit: 'cover', borderRadius: 8, objectPosition: `${posX}% ${posY}%` }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="badge badge-success">Foto sudah dipilih</span>
                  <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={13} /> Ganti Foto
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </label>
                  <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => update('playerImageUrl', '')}>Hapus</button>
                </div>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 16px', border: '2px dashed var(--neutral-300)', borderRadius: 10, cursor: 'pointer', background: 'var(--neutral-50)' }}>
                <ImageIcon size={28} color="var(--neutral-400)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-500)' }}>Klik untuk upload foto pemain</span>
                <span style={{ fontSize: 11, color: 'var(--neutral-400)' }}>JPG, PNG — portrait disarankan</span>
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </label>
            )}
          </div>

          {/* ── KONTROL POSISI FOTO (seperti match result) ── */}
          {form.playerImageUrl && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Atur Posisi Foto</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-600)' }}>Posisi Horizontal</label>
                    <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{posX}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={posX}
                    onChange={e => setPosX(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-600)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--neutral-400)', marginTop: 2 }}>
                    <span>Kiri</span><span>Kanan</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-600)' }}>Posisi Vertikal</label>
                    <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{posY}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={posY}
                    onChange={e => setPosY(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-600)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--neutral-400)', marginTop: 2 }}>
                    <span>Atas</span><span>Bawah</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-600)' }}>Zoom</label>
                    <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{zoom}%</span>
                  </div>
                  <input
                    type="range" min={100} max={180} value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-600)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--neutral-400)', marginTop: 2 }}>
                    <span>Jauh</span><span>Dekat</span>
                  </div>
                </div>

                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => { setPosX(50); setPosY(20); setZoom(100); }}
                  style={{ alignSelf: 'flex-start', fontSize: 11 }}
                >
                  Reset Posisi
                </button>
              </div>
            </div>
          )}

          {/* Info transfer */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Informasi Transfer</div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Nama Pemain <span className="required">*</span></label>
              <input className="form-input" placeholder="Contoh: Eliano Reijnders" value={form.player} onChange={e => update('player', e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Klub Peminat <span className="required">*</span></label>
              <select className="form-select" value={form.destinationClub} onChange={e => update('destinationClub', e.target.value)}>
                <option value="">Pilih dari Master Klub</option>
                {clubs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {destClub && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  {destClub.logoUrl && destClub.logoUrl.startsWith('http') && (
                    <img src={destClub.logoUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  )}
                  <span style={{ fontSize: 12, color: 'var(--primary-600)', fontWeight: 600 }}>{destClub.name}</span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Klub Asal</label>
              <input className="form-input" placeholder="Contoh: Persib Bandung" value={form.fromClub} onChange={e => update('fromClub', e.target.value)} />
            </div>
          </div>

          {/* Caption */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Caption</div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 10 }}>
              Tampil di section bawah, terpisah dari foto pemain.
            </div>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Contoh: Arema FC dikabarkan berminat mendatangkan gelandang ini untuk memperkuat lini tengah musim 2026/27."
              value={form.shortSummary || form.graphicCaption || ''}
              onChange={e => { update('shortSummary', e.target.value); update('graphicCaption', e.target.value); }}
            />
          </div>

          {/* Ekspor */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Ekspor Gambar</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <LoadingButton className="btn btn-md btn-primary" onClick={handleShare} loading={isExporting} loadingLabel="Membuat...">
                <Share2 size={14} /> Bagikan
              </LoadingButton>
              <LoadingButton className="btn btn-md btn-secondary" onClick={handleDownload} loading={isExporting} loadingLabel="Mengunduh...">
                <Download size={14} /> Unduh PNG (9:16)
              </LoadingButton>
            </div>
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
            Preview 9:16
          </div>
          {graphicCard}
        </div>
      </div>
    </div>
  );
}
