'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Rumor } from '@/lib/mockData';
import { APP_HANDLE, APP_LOGO_SRC } from '@/logic/utils';
import { ArrowLeft, Download, Image as ImageIcon, Save, Share2, Upload } from 'lucide-react';
import LoadingButton from '@/views/shared/LoadingButton';
import * as htmlToImage from 'html-to-image';

const RUMOR_GRAPHIC_ELEMENT_ID = 'rumor-transfer-graphic';

const getTransferStatusLabel = (status: Rumor['transferStatus']) => {
  const labels: Record<Rumor['transferStatus'], string> = {
    Rumor: 'Rumor',
    'Advanced Talks': 'Advanced Talks',
    'Here We Go': 'Here We Go',
  };

  return labels[status];
};

const buildRumorFileName = (rumor: Rumor) => (
  `Rumor_${rumor.player || 'Pemain'}_${rumor.destinationClub || 'Klub'}.png`.replace(/[^\w.-]+/g, '_')
);

const getImageAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
  reader.readAsDataURL(file);
});

export default function RumorEditorView({ rumorId }: { rumorId: string }) {
  const router = useRouter();
  const { clubs, rumors, setRumors, logAction, triggerToast } = useApp();
  const isNew = rumorId === 'new';
  const existing = rumors.find(item => item.id === rumorId);
  const base: Rumor = existing || {
    id: `rumor-${Date.now()}`,
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
  const [isExportingGraphic, setIsExportingGraphic] = useState(false);
  const updateForm = <K extends keyof Rumor>(key: K, value: Rumor[K]) => setForm(prev => ({ ...prev, [key]: value }));
  const destinationClub = clubs.find(club => club.name.trim().toLowerCase() === form.destinationClub.trim().toLowerCase() || club.shortName.trim().toLowerCase() === form.destinationClub.trim().toLowerCase());
  const graphicCaption = form.shortSummary || form.graphicCaption || form.headline || 'Rumor transfer terbaru dari Gosball.';

  const buildSavedRumor = (): Rumor => {
    const playerName = form.player.trim();
    const clubName = form.destinationClub.trim();
    const description = graphicCaption.trim();

    return {
      ...form,
      headline: playerName && clubName ? `${playerName} diminati ${clubName}` : form.headline,
      fromClub: form.fromClub || 'Belum diketahui',
      type: 'rumor',
      reliabilityTier: 'C',
      sourceName: form.sourceName || 'Gosball',
      sourceUrl: form.sourceUrl || '',
      publicationStatus: form.publicationStatus || 'Draft',
      transferStatus: 'Rumor',
      probability: 50,
      shortSummary: description,
      articleBody: description,
      graphicCaption: description,
      author: form.author || 'Rumor Editor',
    };
  };

  const handlePlayerImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('File foto pemain harus berupa gambar.', 'error');
      return;
    }

    try {
      const dataUrl = await getImageAsDataUrl(file);
      updateForm('playerImageUrl', dataUrl);
      triggerToast('Foto pemain diterapkan ke preview rumor.');
    } catch (error: any) {
      triggerToast(error.message || 'Gagal membaca foto pemain.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const createRumorGraphicImage = async () => {
    const node = document.getElementById(RUMOR_GRAPHIC_ELEMENT_ID);
    if (!node) throw new Error('Preview gambar rumor tidak ditemukan.');

    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const fileName = buildRumorFileName(buildSavedRumor());

    return { dataUrl, blob, fileName };
  };

  const downloadRumorGraphic = async () => {
    try {
      setIsExportingGraphic(true);
      triggerToast('Mengunduh gambar rumor...');
      const { dataUrl, fileName } = await createRumorGraphicImage();
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Gambar rumor berhasil diunduh.');
    } catch (error: any) {
      console.error('Rumor graphic download failed:', error);
      triggerToast(error.message || 'Gagal mengunduh gambar rumor.', 'error');
    } finally {
      setIsExportingGraphic(false);
    }
  };

  const shareRumorGraphic = async () => {
    try {
      setIsExportingGraphic(true);
      triggerToast('Membuat gambar rumor untuk dibagikan...');
      const { blob, dataUrl, fileName } = await createRumorGraphicImage();
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const savedRumor = buildSavedRumor();
      const shareData: ShareData = {
        files: [file],
        title: savedRumor.headline || 'Rumor Transfer Gosball',
        text: graphicCaption,
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Gambar rumor siap dibagikan.');
        return;
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh sebagai fallback.', 'warning');
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Rumor graphic share failed:', error);
        triggerToast(error.message || 'Gagal membagikan gambar rumor.', 'error');
      }
    } finally {
      setIsExportingGraphic(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!form.player.trim() || !form.destinationClub.trim() || !graphicCaption.trim() || !form.playerImageUrl?.trim()) {
      triggerToast('Foto pemain, nama pemain, klub peminat, dan deskripsi singkat wajib diisi.', 'error');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 350));
    const savedRumor = buildSavedRumor();
    setRumors(prev => isNew ? [savedRumor, ...prev] : prev.map(item => item.id === savedRumor.id ? savedRumor : item));
    logAction(isNew ? 'CREATE_RUMOR' : 'UPDATE_RUMOR', 'Rumor & Transfer', savedRumor.headline);
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
            <p className="page-description" style={{ marginTop: 4 }}>Buat output rumor dari foto pemain, klub peminat, dan deskripsi singkat.</p>
          </div>
        </div>
        <LoadingButton className="btn btn-md btn-primary" onClick={handleSave} loading={isSaving} loadingLabel="Menyimpan...">
          <Save size={16} /> Simpan Rumor
        </LoadingButton>
      </div>

      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: 'span 12' }}>
            <label className="form-label">Foto Pemain <span className="required">*</span></label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Upload
                <input type="file" accept="image/*" hidden onChange={handlePlayerImageUpload} />
              </label>
              {form.playerImageUrl ? (
                <>
                  <span className="badge badge-success">Foto sudah dipilih</span>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => updateForm('playerImageUrl', '')}>Hapus Foto</button>
                </>
              ) : (
                <span className="text-muted" style={{ fontSize: 12 }}>Belum ada foto pemain.</span>
              )}
            </div>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 6' }}>
            <label className="form-label">Nama Pemain <span className="required">*</span></label>
            <input className="form-input" value={form.player} onChange={event => updateForm('player', event.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 6' }}>
            <label className="form-label">Klub Peminat <span className="required">*</span></label>
            <select className="form-select" value={form.destinationClub} onChange={event => updateForm('destinationClub', event.target.value)}>
              <option value="">Pilih klub dari Master Klub</option>
              {clubs.map(club => <option key={club.id} value={club.name}>{club.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 12' }}>
            <label className="form-label">Deskripsi Singkat <span className="required">*</span></label>
            <textarea
              className="form-textarea"
              rows={5}
              value={form.shortSummary || form.graphicCaption || ''}
              placeholder="Contoh: Arema FC dikabarkan berminat mendatangkan gelandang asal Brasil tersebut."
              onChange={event => {
                updateForm('shortSummary', event.target.value);
                updateForm('graphicCaption', event.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div className="semibold" style={{ fontSize: 14 }}>Output Gambar Rumor</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Preview 4:5 dengan style Gosball untuk konten transfer.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <LoadingButton className="btn btn-md btn-primary" onClick={shareRumorGraphic} loading={isExportingGraphic} loadingLabel="Membuat...">
              <Share2 size={14} /> Bagikan Gambar
            </LoadingButton>
            <LoadingButton className="btn btn-md btn-secondary" onClick={downloadRumorGraphic} loading={isExportingGraphic} loadingLabel="Mengunduh...">
              <Download size={14} /> Unduh PNG
            </LoadingButton>
          </div>
          <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            Gunakan foto pemain dengan rasio portrait atau medium close-up agar komposisi terlihat kuat. Logo klub tujuan otomatis diambil jika nama klub cocok dengan Master Klub.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', paddingBottom: 8 }}>
          <div
            id={RUMOR_GRAPHIC_ELEMENT_ID}
            style={{
              width: 360,
              height: 450,
              background: '#0a0a0a',
              color: 'white',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 28px 60px rgba(0,0,0,0.55)',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: 4, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 75% 18%, rgba(200,168,75,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.04), transparent 45%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 2, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                <img src={APP_LOGO_SRC} alt="Gosball" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, color: '#c8a84b', textTransform: 'uppercase' }}>Gosball Transfer Desk</div>
                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.3, textTransform: 'uppercase' }}>Rumor Transfer</div>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 6, background: '#c8a84b', color: '#080808', fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
                {getTransferStatusLabel('Rumor')}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, margin: '0 16px', height: 188, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(200,168,75,0.28)', background: '#141414' }}>
              {form.playerImageUrl ? (
                <img src={form.playerImageUrl} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#555', background: 'linear-gradient(135deg, #101010, #1f1f1f)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <ImageIcon size={34} />
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, marginTop: 8, textTransform: 'uppercase' }}>Foto Pemain</div>
                  </div>
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.72) 100%)' }} />
              {destinationClub?.logoUrl ? (
                <div style={{ position: 'absolute', right: 14, bottom: 12, width: 64, height: 64, borderRadius: 10, background: 'rgba(255,255,255,0.92)', display: 'grid', placeItems: 'center', boxShadow: '0 14px 30px rgba(0,0,0,0.45)' }}>
                  <img src={destinationClub.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                </div>
              ) : null}
            </div>

            <div style={{ position: 'relative', zIndex: 2, padding: '14px 18px 0', display: 'grid', gap: 10 }}>
              <div>
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.8, color: '#c8a84b', textTransform: 'uppercase' }}>Target Player</div>
                <div style={{ fontSize: 26, lineHeight: 1.02, fontWeight: 950, letterSpacing: 0, textTransform: 'uppercase', marginTop: 3 }}>
                  {form.player || 'Nama Pemain'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(200,168,75,0.14)', border: '1px solid rgba(200,168,75,0.35)', display: 'grid', placeItems: 'center', color: '#e8cc6a', fontSize: 10, fontWeight: 900 }}>
                  IN
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 7, color: '#777', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>Diminati Oleh</div>
                  <div style={{ fontSize: 14, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{destinationClub?.name || form.destinationClub || '-'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(200,168,75,0.14)', border: '1px solid rgba(200,168,75,0.35)', color: '#e8cc6a', fontSize: 9, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  Transfer Watch
                </div>
                <div style={{ flex: 1, height: 1, background: 'rgba(200,168,75,0.26)' }} />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                <div style={{ fontSize: 12, lineHeight: 1.42, color: '#e8e8e8', fontWeight: 600 }}>
                  {graphicCaption}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2, padding: '0 18px 14px', display: 'flex', alignItems: 'end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 8, color: '#595959', fontWeight: 700, letterSpacing: 1.2 }}>{APP_HANDLE}</div>
                <div style={{ fontSize: 8, color: '#454545', marginTop: 2 }}>Gosball Transfer Desk</div>
              </div>
              <div style={{ fontSize: 10, color: '#c8a84b', fontWeight: 900, letterSpacing: 1.5 }}>GOSBALL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
