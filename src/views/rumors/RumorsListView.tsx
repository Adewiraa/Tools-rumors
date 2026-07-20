'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Plus } from 'lucide-react';

export default function RumorsListView() {
  const router = useRouter();
  const { rumors, hasPermission } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');

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
          <p className="page-description">Pantau dan perbarui rumor transfer dari kabar awal sampai ada kepastian done deal.</p>
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

      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {rumors.map(rumor => (
            <div
              key={rumor.id}
              className="card"
              style={{ padding: 16, cursor: 'pointer', minHeight: 148, display: 'flex', flexDirection: 'column', gap: 12 }}
              onClick={() => handleEdit(rumor.id)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>{rumor.headline}</h4>
                <div style={{ fontSize: 12, color: 'var(--neutral-500)', lineHeight: 1.45 }}>
                  {rumor.player || 'Pemain belum diisi'} menuju {rumor.destinationClub || 'Klub tujuan'}
                </div>
              </div>
              <div
                style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, color: 'var(--neutral-500)' }}
              >
                <span>{rumor.fromClub || 'Asal belum diketahui'}</span>
                <span>{rumor.author}</span>
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
                <tr key={rumor.id}>
                  <td><span className="semibold">{rumor.headline}</span></td>
                  <td>{rumor.player}</td>
                  <td>{rumor.fromClub}</td>
                  <td>{rumor.destinationClub}</td>
                  <td>{rumor.author}</td>
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
