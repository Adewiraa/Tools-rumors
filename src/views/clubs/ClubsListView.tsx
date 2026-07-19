'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';

export default function ClubsListView() {
  const router = useRouter();
  const { clubs, setClubs, hasPermission, logAction, triggerToast } = useApp();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    const club = clubs.find(item => item.id === id);
    setClubs(prev => prev.filter(item => item.id !== id));
    logAction('DELETE_CLUB', 'Master Klub', club?.name || id);
    triggerToast('Klub berhasil dihapus.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Master Klub</span></div>
          <h1 className="page-title">Master Klub</h1>
          <p className="page-description">Kelola identitas klub, stadion, pelatih, warna, dan logo.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={() => router.push('/clubs?edit=new')}>
            <Plus size={16} /> Tambah Klub
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nama Klub</th>
              <th>Kode</th>
              <th>Kota</th>
              <th>Stadion</th>
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map(club => (
              <tr key={club.id}>
                <td>{club.logoUrl?.startsWith('http') ? <img src={club.logoUrl} alt={club.name} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <span style={{ fontSize: 22 }}>{club.logoUrl || '-'}</span>}</td>
                <td><span className="semibold">{club.name}</span><div className="text-muted" style={{ fontSize: 11 }}>{club.shortName}</div></td>
                <td>{club.code}</td>
                <td>{club.city}</td>
                <td>{club.stadium}</td>
                <td>
                  <div className="flex align-center gap-8">
                    <div style={{ width: 70, height: 6, background: 'var(--neutral-200)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${club.completeness}%`, height: '100%', background: 'var(--primary-600)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{club.completeness}%</span>
                  </div>
                </td>
                <td className="text-right">
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => router.push(`/clubs?edit=${club.id}`)}><Edit size={13} /> Edit</button>
                    {hasPermission('Master', 'delete') && (confirmDeleteId === club.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(club.id)}>Ya</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(club.id)}><Trash2 size={13} /></button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
