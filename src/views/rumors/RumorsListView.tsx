'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Rumor } from '@/lib/mockData';
import { ChevronRight, Download, Edit3, Eye, Image as ImageIcon, Plus, Share2, Trash2, X } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

export default function RumorsListView() {
  const router = useRouter();
  const { appSettings, rumors, setRumors, clubs, hasPermission, logAction, triggerToast } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [selectedRumor, setSelectedRumor] = useState<Rumor | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleCreateNew = () => {
    router.push('/rumors?edit=new');
  };

  const handleEdit = (id: string) => {
    router.push(`/rumors?edit=${id}`);
  };

  const handleDelete = async (rumor: Rumor) => {
    try {
      const res = await fetch(`/api/rumors?id=${encodeURIComponent(rumor.id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        triggerToast(`Gagal menghapus: ${json.error}`, 'error');
        return;
      }
    } catch {
      triggerToast('Terjadi kesalahan saat menghapus rumor.', 'error');
      return;
    }
    setRumors(prev => prev.filter(item => item.id !== rumor.id));
    if (selectedRumor?.id === rumor.id) setSelectedRumor(null);
    setConfirmDeleteId(null);
    logAction('DELETE_RUMOR', 'Rumor & Transfer', `${rumor.player || 'Pemain'} (${rumor.fromClub || '-'} → ${rumor.destinationClub || '-'}) — "${rumor.headline || rumor.id}"`);
    triggerToast('Rumor berhasil dihapus.');
  };

  const getDestinationClub = (rumor: Rumor) => clubs.find(c =>
    c.name.trim().toLowerCase() === rumor.destinationClub.trim().toLowerCase() ||
    c.shortName.trim().toLowerCase() === rumor.destinationClub.trim().toLowerCase()
  );

  const getCaption = (rumor: Rumor) => (
    rumor.shortSummary || rumor.graphicCaption || rumor.headline || ''
  ).trim();

  const exportRumorGraphic = async (rumor: Rumor) => {
    const node = document.getElementById(`rumor-modal-graphic-${rumor.id}`);
    if (!node) throw new Error('Preview tidak ditemukan.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const blob = await (await fetch(dataUrl)).blob();
    const fileName = `Rumor_${rumor.player || 'Pemain'}_${rumor.destinationClub || 'Klub'}.png`.replace(/[^\w.-]+/g, '_');
    return { dataUrl, blob, fileName };
  };

  const handleDownloadRumor = async (rumor: Rumor) => {
    try {
      setIsExporting(true);
      triggerToast('Mengunduh gambar rumor...');
      const { dataUrl, fileName } = await exportRumorGraphic(rumor);
      const a = document.createElement('a');
      a.download = fileName;
      a.href = dataUrl;
      a.click();
      triggerToast('Gambar rumor berhasil diunduh!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunduh gambar.';
      triggerToast(msg, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareRumor = async (rumor: Rumor) => {
    try {
      setIsExporting(true);
      triggerToast('Membuat gambar rumor...');
      const { blob, fileName } = await exportRumorGraphic(rumor);
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: rumor.headline,
        text: getCaption(rumor),
      };
      if (typeof nav.share === 'function' && nav.canShare?.(shareData)) {
        await nav.share(shareData);
        triggerToast('Gambar rumor siap dibagikan.');
      } else {
        const { dataUrl } = await exportRumorGraphic(rumor);
        const a = document.createElement('a');
        a.download = fileName;
        a.href = dataUrl;
        a.click();
        triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh.', 'warning');
      }
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : '';
      if (errorName !== 'AbortError') {
        const msg = err instanceof Error ? err.message : 'Gagal membagikan gambar.';
        triggerToast(msg, 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const renderRumorGraphic = (rumor: Rumor, compact = false, elementId?: string) => {
    const destClub = getDestinationClub(rumor);
    const caption = getCaption(rumor);
    const posX = rumor.playerImagePositionX ?? 50;
    const posY = rumor.playerImagePositionY ?? 20;
    const zoom = rumor.playerImageZoom ?? 100;
    const width = compact ? 180 : 360;
    const height = compact ? 320 : 640;
    const scale = compact ? 0.5 : 1;

    return (
      <div
        id={elementId}
        style={{
          width,
          height,
          background: '#0a0a0a',
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: compact ? 'none' : '0 30px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ height: 3 * scale, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', flexShrink: 0, zIndex: 5 }} />

        <div style={{ position: 'relative', flex: '0 0 72%', overflow: 'hidden' }}>
          {rumor.playerImageUrl ? (
            <img
              src={rumor.playerImageUrl}
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
                <ImageIcon size={compact ? 28 : 48} />
                <div style={{ fontSize: compact ? 6 : 10, fontWeight: 800, letterSpacing: 1.5, marginTop: compact ? 6 : 10, textTransform: 'uppercase' }}>Upload Foto Pemain</div>
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.55) 55%, transparent 100%)', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)', zIndex: 1 }} />

          <div style={{ position: 'absolute', top: 14 * scale, left: 14 * scale, zIndex: 3 }}>
            <div style={{ padding: `${5 * scale}px ${11 * scale}px`, background: '#c8a84b', borderRadius: 5 * scale }}>
              <span style={{ fontSize: 8 * scale, fontWeight: 900, color: '#0a0a0a', letterSpacing: compact ? 0.8 : 1.5, textTransform: 'uppercase' }}>TRANSFER WATCH</span>
            </div>
          </div>

          {destClub?.logoUrl && destClub.logoUrl.startsWith('http') && (
            <div style={{ position: 'absolute', top: 10 * scale, right: 14 * scale, zIndex: 3 }}>
              <img
                src={destClub.logoUrl}
                crossOrigin="anonymous"
                alt=""
                style={{ width: 52 * scale, height: 52 * scale, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}
              />
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: `0 ${16 * scale}px ${14 * scale}px` }}>
            <div style={{ fontSize: 8 * scale, fontWeight: 700, color: '#c8a84b', letterSpacing: compact ? 1.1 : 2, textTransform: 'uppercase', marginBottom: 3 * scale }}>
              Target Player
            </div>
            <div style={{ fontSize: 28 * scale, fontWeight: 950, textTransform: 'uppercase', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
              {rumor.player || <span style={{ color: '#444' }}>Nama Pemain</span>}
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 auto', background: '#0a0a0a', borderTop: '1px solid rgba(200,168,75,0.25)', display: 'flex', flexDirection: 'column', padding: `${13 * scale}px ${16 * scale}px ${10 * scale}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 * scale, marginBottom: 9 * scale }}>
            <div style={{ fontSize: 8 * scale, fontWeight: 700, color: '#666', letterSpacing: compact ? 0.8 : 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Diminati Oleh</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(200,168,75,0.2)' }} />
            <div style={{ fontSize: 13 * scale, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
              {destClub?.shortName || rumor.destinationClub || <span style={{ color: '#333' }}>Klub Tujuan</span>}
            </div>
          </div>

          <div style={{ flex: 1, fontSize: 12 * scale, lineHeight: 1.5, color: '#d1d5db', fontWeight: 400, overflow: 'hidden' }}>
            {caption || <span style={{ color: '#333' }}>Caption akan muncul di sini...</span>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 * scale }}>
            <img
              src={appSettings.appLogoSrc}
              crossOrigin="anonymous"
              alt={appSettings.appName}
              style={{ height: 24 * scale, objectFit: 'contain', opacity: 0.9, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))' }}
            />
          </div>
        </div>

        <div style={{ height: 3 * scale, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', flexShrink: 0 }} />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Rumor & Transfer Pemain</span>
          </div>
          <h1 className="page-title">Rumor & Transfer</h1>
          <p className="page-description">Pantau dan perbarui rumor transfer dari kabar awal sampai ada kepastian done deal.</p>
        </div>
        {hasPermission('Rumor', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={handleCreateNew}>
            <Plus size={16} /> Tambah Rumor
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{rumors.length}</div>
          <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>Rumor aktif untuk terus diperbarui</div>
        </div>
        <div style={{ border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('board')}>Board View</button>
          <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('table')}>Table View</button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {rumors.map(rumor => (
            <div
              key={rumor.id}
              className="card"
              role="button"
              tabIndex={0}
              style={{
                padding: 0,
                overflow: 'hidden',
                border: '1px solid var(--neutral-200)',
                textAlign: 'left',
                cursor: 'pointer',
                background: 'var(--white)',
                display: 'grid',
                gridTemplateColumns: '118px 1fr',
                minHeight: 190,
              }}
              onClick={() => setSelectedRumor(rumor)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedRumor(rumor);
                }
              }}
            >
              <div style={{ background: '#0a0a0a', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {renderRumorGraphic(rumor, true)}
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--primary-600)' }}>Rumor Watch</span>
                  <Eye size={16} color="var(--neutral-500)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 850, lineHeight: 1.25, marginBottom: 8 }}>{rumor.headline || `${rumor.player} menuju ${rumor.destinationClub}`}</h3>
                  <p style={{ fontSize: 12, color: 'var(--neutral-600)', lineHeight: 1.45 }}>
                    {rumor.player || 'Pemain belum diisi'} menuju {rumor.destinationClub || 'Klub tujuan'}
                  </p>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{rumor.fromClub || 'Asal belum diketahui'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {confirmDeleteId === rumor.id ? (
                      <>
                        <span
                          role="button"
                          tabIndex={0}
                          className="btn btn-sm btn-danger"
                          onClick={(event) => { event.stopPropagation(); handleDelete(rumor); }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDelete(rumor);
                            }
                          }}
                        >
                          Ya
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          className="btn btn-sm btn-secondary"
                          onClick={(event) => { event.stopPropagation(); setConfirmDeleteId(null); }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              setConfirmDeleteId(null);
                            }
                          }}
                        >
                          Batal
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          role="button"
                          tabIndex={0}
                          className="btn btn-sm btn-secondary"
                          onClick={(event) => { event.stopPropagation(); handleEdit(rumor.id); }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              handleEdit(rumor.id);
                            }
                          }}
                        >
                          <Edit3 size={13} /> Edit
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          className="btn btn-sm btn-secondary"
                          style={{ color: 'var(--danger-600)' }}
                          onClick={(event) => { event.stopPropagation(); setConfirmDeleteId(rumor.id); }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              setConfirmDeleteId(rumor.id);
                            }
                          }}
                        >
                          <Trash2 size={13} /> Hapus
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Pemain</th>
                <th>Klub Asal</th>
                <th>Klub Tujuan</th>
                <th>Penulis</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rumors.map(rumor => (
                <tr key={rumor.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedRumor(rumor)}>
                  <td><span className="semibold">{rumor.headline}</span></td>
                  <td>{rumor.player}</td>
                  <td>{rumor.fromClub}</td>
                  <td>{rumor.destinationClub}</td>
                  <td>{rumor.author}</td>
                  <td className="text-right">
                    <button className="btn btn-sm btn-secondary" onClick={(event) => { event.stopPropagation(); setSelectedRumor(rumor); }}>
                      <Eye size={13} /> Lihat
                    </button>
                    <button className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }} onClick={(event) => { event.stopPropagation(); handleEdit(rumor.id); }}>
                      <Edit3 size={13} /> Edit
                    </button>
                    {confirmDeleteId === rumor.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" style={{ marginLeft: 8 }} onClick={(event) => { event.stopPropagation(); handleDelete(rumor); }}>
                          Ya
                        </button>
                        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }} onClick={(event) => { event.stopPropagation(); setConfirmDeleteId(null); }}>
                          Batal
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-secondary" style={{ marginLeft: 8, color: 'var(--danger-600)' }} onClick={(event) => { event.stopPropagation(); setConfirmDeleteId(rumor.id); }}>
                        <Trash2 size={13} /> Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRumor && (
        <div className="rumor-modal-overlay" onClick={() => setSelectedRumor(null)}>
          <div className="rumor-modal-layout" onClick={(event) => event.stopPropagation()}>
            <div className="rumor-modal-art">
              {renderRumorGraphic(selectedRumor, false)}
            </div>

            <div className="rumor-export-node" aria-hidden="true">
              {renderRumorGraphic(selectedRumor, false, `rumor-modal-graphic-${selectedRumor.id}`)}
            </div>

            <div className="rumor-modal-panel">
              <button
                type="button"
                className="btn btn-sm btn-secondary rumor-modal-close"
                onClick={() => setSelectedRumor(null)}
              >
                <X size={14} /> Tutup
              </button>

              <div className="rumor-modal-copy">
                <div className="rumor-modal-eyebrow">Preview Gambar Rumor</div>
                <h2>{selectedRumor.headline}</h2>
                <p>{getCaption(selectedRumor) || 'Caption belum diisi.'}</p>
              </div>

              {/* Ekspor Gambar Buttons */}
              <div className="rumor-modal-section">
                <div className="rumor-modal-section-title">Ekspor Gambar</div>
                <div className="rumor-modal-actions-row">
                  <button
                    type="button"
                    className="btn btn-md btn-primary"
                    disabled={isExporting}
                    onClick={() => handleShareRumor(selectedRumor)}
                  >
                    <Share2 size={15} /> Bagikan
                  </button>
                  <button
                    type="button"
                    className="btn btn-md btn-secondary rumor-modal-secondary"
                    disabled={isExporting}
                    onClick={() => handleDownloadRumor(selectedRumor)}
                  >
                    <Download size={15} /> Unduh PNG (9:16)
                  </button>
                </div>
              </div>

              <div className="rumor-modal-manage">
                <button
                  type="button"
                  className="btn btn-md btn-secondary rumor-modal-secondary"
                  onClick={() => handleEdit(selectedRumor.id)}
                >
                  <Edit3 size={15} /> Edit Rumor
                </button>
                {confirmDeleteId === selectedRumor.id ? (
                  <div className="rumor-modal-confirm">
                    <button type="button" className="btn btn-md btn-danger" onClick={() => handleDelete(selectedRumor)}>
                      Ya, Hapus
                    </button>
                    <button type="button" className="btn btn-md btn-secondary rumor-modal-secondary" onClick={() => setConfirmDeleteId(null)}>
                      Batal
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-md btn-secondary rumor-modal-danger" onClick={() => setConfirmDeleteId(selectedRumor.id)}>
                    <Trash2 size={15} /> Hapus Rumor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
