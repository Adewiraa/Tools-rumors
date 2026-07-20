'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Rumor } from '@/lib/mockData';
import { ChevronRight, Plus } from 'lucide-react';

export default function RumorsListView() {
  const router = useRouter();
  const { rumors, setRumors, hasPermission, logAction, triggerToast } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [draggingRumorId, setDraggingRumorId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Rumor['publicationStatus'] | null>(null);

  const boardColumns: Rumor['publicationStatus'][] = ['Draft', 'Review', 'Scheduled', 'Published'];
  const columnLabels: Record<Rumor['publicationStatus'], string> = {
    Draft: 'Draft',
    Review: 'Review',
    Scheduled: 'Scheduled',
    Published: 'Published',
  };

  const handleCreateNew = () => {
    router.push('/rumors?edit=new');
  };

  const handleEdit = (id: string) => {
    router.push(`/rumors?edit=${id}`);
  };

  const moveRumorToColumn = (rumorId: string, nextStatus: Rumor['publicationStatus']) => {
    const selectedRumor = rumors.find(rumor => rumor.id === rumorId);
    if (!selectedRumor || selectedRumor.publicationStatus === nextStatus) return;

    setRumors(prev => prev.map(rumor => (
      rumor.id === rumorId ? { ...rumor, publicationStatus: nextStatus } : rumor
    )));
    logAction('MOVE_RUMOR_STATUS', 'Rumor & Transfer', `${selectedRumor.headline}: ${selectedRumor.publicationStatus} -> ${nextStatus}`);
    triggerToast(`Rumor dipindahkan ke ${columnLabels[nextStatus]}.`);
  };

  const handleDropOnColumn = (event: React.DragEvent<HTMLDivElement>, status: Rumor['publicationStatus']) => {
    event.preventDefault();
    const rumorId = event.dataTransfer.getData('text/plain') || draggingRumorId;
    if (rumorId) moveRumorToColumn(rumorId, status);
    setDraggingRumorId(null);
    setDragOverColumn(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Rumor & Transfer Pemain</span>
          </div>
          <h1 className="page-title">Rumor & Transfer</h1>
          <p className="page-description">Kelola draft transfer, review editorial, jadwal publikasi, dan arsip konten yang sudah tayang.</p>
        </div>
        {hasPermission('Rumor', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={handleCreateNew}>
            <Plus size={16} /> Tambah Rumor
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{ border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('board')}>Board View</button>
          <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('table')}>Table View</button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {boardColumns.map(col => {
            const colRumors = rumors.filter(r => r.publicationStatus === col);
            const isDragTarget = dragOverColumn === col;
            return (
              <div
                key={col}
                onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverColumn(col); }}
                onDragLeave={() => setDragOverColumn(prev => prev === col ? null : prev)}
                onDrop={(event) => handleDropOnColumn(event, col)}
                style={{
                  backgroundColor: isDragTarget ? 'var(--primary-50)' : 'var(--neutral-100)',
                  border: `1px solid ${isDragTarget ? 'var(--primary-600)' : 'transparent'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 12,
                  minHeight: 400,
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div className="flex justify-between align-center" style={{ marginBottom: 12 }}>
                  <span className="semibold" style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--neutral-750)' }}>{columnLabels[col]}</span>
                  <span className="badge badge-info" style={{ fontSize: 10, padding: '2px 6px' }}>{colRumors.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {colRumors.map(rumor => (
                    <div
                      key={rumor.id}
                      className="card"
                      draggable
                      onClick={() => handleEdit(rumor.id)}
                      onDragStart={(event) => {
                        setDraggingRumorId(rumor.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', rumor.id);
                      }}
                      onDragEnd={() => { setDraggingRumorId(null); setDragOverColumn(null); }}
                      style={{ padding: 14, cursor: 'grab', opacity: draggingRumorId === rumor.id ? 0.55 : 1 }}
                    >
                      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, lineHeight: 1.35 }}>{rumor.headline}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: 'var(--neutral-500)' }}>
                        <span>{rumor.player || 'Pemain belum diisi'} menuju {rumor.destinationClub || 'Klub tujuan'}</span>
                        <span>{rumor.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Pemain</th>
                <th>Klub Asal</th>
                <th>Klub Tujuan</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rumors.map(rumor => (
                <tr key={rumor.id}>
                  <td><span className="semibold">{rumor.headline}</span></td>
                  <td>{rumor.player}</td>
                  <td>{rumor.fromClub}</td>
                  <td>{rumor.destinationClub}</td>
                  <td>
                    <select
                      className="form-select"
                      value={rumor.publicationStatus}
                      onChange={(event) => moveRumorToColumn(rumor.id, event.target.value as Rumor['publicationStatus'])}
                      style={{ minWidth: 130, height: 32, padding: '4px 8px', fontSize: 12 }}
                    >
                      {boardColumns.map(status => <option key={status} value={status}>{columnLabels[status]}</option>)}
                    </select>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(rumor.id)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
