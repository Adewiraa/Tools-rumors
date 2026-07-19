'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';

export default function PlayersListView() {
  const router = useRouter();
  const { players, setPlayers, clubs, hasPermission, logAction, triggerToast } = useApp();
  const [selectedClubId, setSelectedClubId] = useState('Semua');
  const [selectedPosition, setSelectedPosition] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if ((selectedClubId === 'Semua' || !selectedClubId) && clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  const filteredPlayers = players.filter(player => {
    const matchClub = selectedClubId === 'Semua' || player.clubId === selectedClubId;
    const matchPosition = selectedPosition === 'Semua' || player.position === selectedPosition;
    return matchClub && matchPosition;
  });

  const handleDelete = (id: string) => {
    const player = players.find(item => item.id === id);
    setPlayers(prev => prev.filter(item => item.id !== id));
    logAction('DELETE_PLAYER', 'Master Pemain', player?.fullName || id);
    triggerToast('Pemain berhasil dihapus.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Master Pemain</span></div>
          <h1 className="page-title">Master Pemain</h1>
          <p className="page-description">Kelola profil pemain, klub aktif, posisi, nomor punggung, negara, dan availability.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={() => router.push('/players?edit=new')}><Plus size={16} /> Tambah Pemain</button>
        )}
      </div>

      <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <select className="form-select" style={{ maxWidth: 280 }} value={selectedClubId} onChange={event => setSelectedClubId(event.target.value)}>
          <option value="Semua">Semua Klub</option>
          {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 220 }} value={selectedPosition} onChange={event => setSelectedPosition(event.target.value)}>
          <option value="Semua">Semua Posisi</option>
          <option value="Goalkeeper">Goalkeeper</option>
          <option value="Defender">Defender</option>
          <option value="Midfielder">Midfielder</option>
          <option value="Forward">Forward</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Negara</th>
              <th>Nama</th>
              <th>Klub</th>
              <th>Posisi</th>
              <th>No</th>
              <th>Availability</th>
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.id}>
                <td>{player.flagUrl?.startsWith('http') ? <img src={player.flagUrl} alt={player.nationality} style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }} /> : player.flagUrl}</td>
                <td><span className="semibold">{player.fullName}</span><div className="text-muted" style={{ fontSize: 11 }}>{player.displayName}</div></td>
                <td>{clubs.find(club => club.id === player.clubId)?.name || player.clubName || 'Free Agent'}</td>
                <td>{player.position}</td>
                <td>#{player.shirtNumber}</td>
                <td><span className={`badge ${player.availability === 'available' ? 'badge-success' : 'badge-warning'}`}>{player.availability}</span></td>
                <td>
                  <div className="flex align-center gap-8">
                    <div style={{ width: 70, height: 6, background: 'var(--neutral-200)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${player.completeness}%`, height: '100%', background: player.completeness >= 80 ? 'var(--success-600)' : 'var(--warning-600)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{player.completeness}%</span>
                  </div>
                </td>
                <td className="text-right">
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => router.push(`/players?edit=${player.id}`)}><Edit size={13} /> Edit</button>
                    {hasPermission('Master', 'delete') && (confirmDeleteId === player.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(player.id)}>Ya</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(player.id)}><Trash2 size={13} /></button>
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
