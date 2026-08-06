'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, Edit, Image as ImageIcon, Megaphone, Plus, Trash2, Upload, Video } from 'lucide-react';
import { useApp } from '@/logic/AppContext';
import { Badge, Button, Card, Input, Select } from '@/components/ui';
import LoadingButton from '@/views/shared/LoadingButton';

type MediaAd = {
  id: string;
  title: string;
  label: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  posterUrl: string;
  mimeType: string;
  fileName: string;
  fit: 'contain' | 'cover';
  placement: 'result_package' | 'lineup_package' | 'all';
  status: 'active' | 'inactive' | 'archived';
  competition: string;
  clubId: string;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
};

type MediaAdDraft = Omit<MediaAd, 'id'> & { id?: string };

const emptyDraft: MediaAdDraft = {
  title: '',
  label: 'MEDIA PARTNER',
  mediaType: 'image',
  mediaUrl: '',
  posterUrl: '',
  mimeType: '',
  fileName: '',
  fit: 'contain',
  placement: 'result_package',
  status: 'active',
  competition: '',
  clubId: '',
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
};

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error && error.message ? error.message : fallback
);

const normalizeDateInput = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const placementLabel = (placement: MediaAd['placement']) => ({
  result_package: 'Hasil HT/FT',
  lineup_package: 'Lineup',
  all: 'Semua Paket',
}[placement] || placement);

export default function MediaAdsListView() {
  const { competitions, hasPermission, logAction, triggerToast } = useApp();
  const [mediaAds, setMediaAds] = useState<MediaAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [draft, setDraft] = useState<MediaAdDraft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadMediaAds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/media-ads');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Master iklan belum bisa dimuat.');
      }
      setMediaAds(result.data || []);
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Master iklan belum bisa dimuat.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMediaAds();
  }, []);

  const openCreate = () => {
    setDraft(emptyDraft);
    setFile(null);
    setModalOpen(true);
  };

  const openEdit = (item: MediaAd) => {
    setDraft({
      ...item,
      startsAt: normalizeDateInput(item.startsAt),
      endsAt: normalizeDateInput(item.endsAt),
    });
    setFile(null);
    setModalOpen(true);
  };

  const uploadMediaFile = async () => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'media-ads');
    formData.append('folder', draft.title || 'media-ads');

    const response = await fetch('/api/uploads/logo', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload media iklan gagal.');
    }

    return {
      mediaUrl: result.data.publicUrl as string,
      mimeType: file.type,
      fileName: file.name,
      mediaType: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
    };
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      triggerToast('Nama iklan wajib diisi.', 'error');
      return;
    }

    if (!draft.mediaUrl && !file) {
      triggerToast('Upload gambar atau video iklan terlebih dahulu.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const uploaded = await uploadMediaFile();
      const payload = {
        ...draft,
        ...(uploaded || {}),
      };

      const response = await fetch('/api/media-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Master iklan gagal disimpan.');
      }

      setMediaAds(prev => {
        const exists = prev.some(item => item.id === result.data.id);
        return exists
          ? prev.map(item => item.id === result.data.id ? result.data : item)
          : [result.data, ...prev];
      });
      logAction(draft.id ? 'UPDATE_MEDIA_AD' : 'CREATE_MEDIA_AD', 'Master Iklan', draft.title);
      triggerToast('Master iklan berhasil disimpan.');
      setModalOpen(false);
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Master iklan gagal disimpan.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const target = mediaAds.find(item => item.id === id);
      const response = await fetch(`/api/media-ads?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Master iklan gagal dihapus.');
      }
      setMediaAds(prev => prev.filter(item => item.id !== id));
      logAction('DELETE_MEDIA_AD', 'Master Iklan', target?.title || id);
      triggerToast('Master iklan berhasil dihapus.');
      setConfirmDeleteId(null);
    } catch (error: unknown) {
      triggerToast(getErrorMessage(error, 'Master iklan gagal dihapus.'), 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Master Iklan</span></div>
          <h1 className="page-title">Master Iklan</h1>
          <p className="page-description">Kelola aset partner berupa gambar atau video untuk paket share halftime, fulltime, dan lineup.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <Button onClick={openCreate}><Plus size={16} /> Tambah Iklan</Button>
        )}
      </div>

      <Card style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge status="success">{mediaAds.filter(item => item.status === 'active').length} Aktif</Badge>
        <Badge status="draft">{mediaAds.filter(item => item.status !== 'active').length} Nonaktif/Arsip</Badge>
        <span className="text-muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{mediaAds.length} total master iklan</span>
      </Card>

      {isLoading ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>Memuat master iklan...</Card>
      ) : mediaAds.length === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <Megaphone size={34} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Belum ada master iklan</h3>
          <p className="text-muted" style={{ marginBottom: 18 }}>Tambahkan gambar atau video partner terlebih dahulu.</p>
          {hasPermission('Master', 'create_edit') && (
            <Button size="sm" onClick={openCreate}><Plus size={14} /> Tambah Iklan</Button>
          )}
        </Card>
      ) : (
        <div className="table-wrapper master-table-wrapper">
          <table className="data-table master-card-table">
            <thead>
              <tr>
                <th>Iklan</th>
                <th>Media</th>
                <th>Placement</th>
                <th>Kompetisi</th>
                <th>Periode</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mediaAds.map(item => (
                <tr key={item.id}>
                  <td className="master-title-cell" data-label="Iklan">
                    <div className="flex align-center gap-8">
                      <div style={{ width: 54, height: 38, border: '1px solid var(--neutral-200)', borderRadius: 6, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#fff' }}>
                        {item.mediaType === 'video'
                          ? <Video size={18} color="var(--primary-700)" />
                          : item.mediaUrl ? <img src={item.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={18} />}
                      </div>
                      <div>
                        <span className="semibold">{item.title}</span>
                        <div className="text-muted" style={{ fontSize: 11 }}>{item.label || 'MEDIA PARTNER'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="master-info-cell" data-label="Media">
                    <Badge status={item.mediaType === 'video' ? 'info' : 'success'}>
                      {item.mediaType === 'video' ? 'Video' : 'Gambar'}
                    </Badge>
                  </td>
                  <td className="master-info-cell" data-label="Placement">{placementLabel(item.placement)}</td>
                  <td className="master-info-cell" data-label="Kompetisi">{item.competition || 'Semua'}</td>
                  <td className="master-info-cell" data-label="Periode">
                    <div style={{ display: 'grid', gap: 2, fontSize: 11 }}>
                      <span>{item.startsAt ? new Date(item.startsAt).toLocaleDateString('id-ID') : 'Mulai bebas'}</span>
                      <span className="text-muted">{item.endsAt ? `s.d. ${new Date(item.endsAt).toLocaleDateString('id-ID')}` : 'Tanpa akhir'}</span>
                    </div>
                  </td>
                  <td className="master-info-cell" data-label="Status">
                    <Badge status={item.status === 'active' ? 'success' : item.status === 'inactive' ? 'warning' : 'draft'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="master-actions-cell text-right">
                    <div className="master-actions">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(item)}><Edit size={13} /> Edit</Button>
                      {hasPermission('Master', 'delete') && (confirmDeleteId === item.id ? (
                        <>
                          <LoadingButton className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)} loading={isDeleting === item.id} loadingLabel="Menghapus...">Ya</LoadingButton>
                          <Button size="sm" variant="secondary" disabled={isDeleting === item.id} onClick={() => setConfirmDeleteId(null)}>Batal</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(item.id)}><Trash2 size={13} /></Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3>{draft.id ? 'Edit Master Iklan' : 'Tambah Master Iklan'}</h3>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
                <Input label="Nama Iklan" value={draft.title} onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))} placeholder="Contoh: DIPA Healthcare Campaign" />
                <Select label="Status" value={draft.status} onChange={event => setDraft(prev => ({ ...prev, status: event.target.value as MediaAd['status'] }))}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="archived">Arsip</option>
                </Select>
              </div>

              <Input label="Label di Template" value={draft.label} onChange={event => setDraft(prev => ({ ...prev, label: event.target.value }))} placeholder="Contoh: MEDIA PARTNER" />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                <Select label="Placement" value={draft.placement} onChange={event => setDraft(prev => ({ ...prev, placement: event.target.value as MediaAd['placement'] }))}>
                  <option value="result_package">Hasil HT/FT</option>
                  <option value="lineup_package">Lineup</option>
                  <option value="all">Semua Paket</option>
                </Select>
                <Select label="Fit" value={draft.fit} onChange={event => setDraft(prev => ({ ...prev, fit: event.target.value as MediaAd['fit'] }))}>
                  <option value="contain">Logo utuh</option>
                  <option value="cover">Isi area</option>
                </Select>
                <Input label="Urutan" type="number" value={draft.sortOrder} onChange={event => setDraft(prev => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))} />
              </div>

              <Select label="Kompetisi" value={draft.competition} onChange={event => setDraft(prev => ({ ...prev, competition: event.target.value }))}>
                <option value="">Semua Kompetisi</option>
                {competitions.map(comp => <option key={comp.id} value={comp.name}>{comp.name}</option>)}
              </Select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input label="Mulai Tayang" type="datetime-local" value={draft.startsAt} onChange={event => setDraft(prev => ({ ...prev, startsAt: event.target.value }))} />
                <Input label="Akhir Tayang" type="datetime-local" value={draft.endsAt} onChange={event => setDraft(prev => ({ ...prev, endsAt: event.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">File Media</label>
                <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', width: 'fit-content' }}>
                  <Upload size={14} /> {file ? file.name : draft.mediaUrl ? 'Ganti File' : 'Upload Gambar/Video'}
                  <input type="file" accept="image/*,video/*" hidden onChange={event => {
                    const nextFile = event.target.files?.[0] || null;
                    setFile(nextFile);
                    if (nextFile) {
                      setDraft(prev => ({
                        ...prev,
                        mediaType: nextFile.type.startsWith('video/') ? 'video' : 'image',
                        mimeType: nextFile.type,
                        fileName: nextFile.name,
                      }));
                    }
                  }} />
                </label>
                {draft.mediaUrl && !file && (
                  <span className="form-helper">File tersimpan: {draft.fileName || draft.mediaUrl}</span>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" disabled={isSaving} onClick={() => setModalOpen(false)}>Batal</Button>
              <LoadingButton className="btn btn-md btn-primary" onClick={handleSave} loading={isSaving} loadingLabel="Menyimpan...">Simpan Iklan</LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
