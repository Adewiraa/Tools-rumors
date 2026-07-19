'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Rumor } from '@/lib/mockData';
import { ChevronRight, Plus } from 'lucide-react';

export default function RumorsListView() {
  const router = useRouter();
  const { rumors, hasPermission } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [selectedTier, setSelectedTier] = useState('Semua');

  const filteredRumors = rumors.filter(r => selectedTier === 'Semua' || r.reliabilityTier === selectedTier);

  // Kanban Columns
  const boardColumns = ['Draft', 'Review', 'Scheduled', 'Published'];

  const handleCreateNew = () => {
    router.push('/rumors?edit=new');
  };

  const handleEdit = (id: string) => {
    router.push(`/rumors?edit=${id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Rumor & Transfer Pemain</span>
          </div>
          <h1 className="page-title">Rumor & Transfer</h1>
          <p className="page-description">Kelola berita transfer terbaru, tingkat validitas rumor (Tiers A-D), dan editorial timeline.</p>
        </div>
        {hasPermission('Rumor', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={handleCreateNew}>
            <Plus size={16} /> Tambah Rumor
          </button>
        )}
      </div>

      {/* Filter / View Toggler */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex gap-12">
          <select className="form-select" value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
            <option value="Semua">Semua Reliability Tier</option>
            <option value="A">Tier A (Sangat Terpercaya)</option>
            <option value="B">Tier B (Terpercaya)</option>
            <option value="C">Tier C (Berkembang)</option>
            <option value="D">Tier D (Spekulatif)</option>
          </select>
        </div>

        <div style={{ border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('board')}>Board View</button>
          <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('table')}>Table View</button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {boardColumns.map(col => {
            const colRumors = filteredRumors.filter(r => r.publicationStatus === col);
            return (
              <div key={col} style={{ backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-lg)', padding: 12, minHeight: 400 }}>
                <div className="flex justify-between align-center" style={{ marginBottom: 12 }}>
                  <span className="semibold" style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--neutral-750)' }}>{col}</span>
                  <span className="badge badge-info" style={{ fontSize: 10, padding: '2px 6px' }}>{colRumors.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {colRumors.map(rumor => (
                    <div key={rumor.id} className="card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => handleEdit(rumor.id)}>
                      <span className={`badge ${rumor.reliabilityTier === 'A' ? 'badge-success' : rumor.reliabilityTier === 'B' ? 'badge-info' : rumor.reliabilityTier === 'C' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 9, padding: '2px 6px', marginBottom: 8 }}>
                        Tier {rumor.reliabilityTier}
                      </span>
                      <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{rumor.headline}</h4>
                      <div className="flex justify-between align-center" style={{ fontSize: 10, color: 'var(--neutral-500)' }}>
                        <span>Peluang: {rumor.probability}%</span>
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
                <th>Tier</th>
                <th>Publikasi</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRumors.map(rumor => (
                <tr key={rumor.id}>
                  <td><span className="semibold">{rumor.headline}</span></td>
                  <td>{rumor.player}</td>
                  <td>{rumor.fromClub}</td>
                  <td>{rumor.destinationClub}</td>
                  <td>
                    <span className={`badge ${rumor.reliabilityTier === 'A' ? 'badge-success' : rumor.reliabilityTier === 'B' ? 'badge-info' : rumor.reliabilityTier === 'C' ? 'badge-warning' : 'badge-danger'}`}>
                      Tier {rumor.reliabilityTier}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-draft">{rumor.publicationStatus}</span>
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
