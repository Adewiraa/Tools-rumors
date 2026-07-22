'use client';

import React, { useState } from 'react';
import { useApp } from '@/logic/AppContext';
import { UserRole, AppUser } from '@/lib/types/auth';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  Key,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';

export default function UserManagementView() {
  const { users, addUser, updateUser, deleteUser, triggerToast, currentUserRole } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'Match Editor' as UserRole,
    status: 'active' as 'active' | 'inactive',
  });

  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleShowPassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'Match Editor',
      status: 'active',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // leave empty unless changing
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user: AppUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.fullName.trim()) {
      triggerToast('Semua field wajib diisi!', 'warning');
      return;
    }
    setIsSubmitting(true);
    const success = await addUser({
      username: formData.username.trim(),
      password: formData.password.trim(),
      fullName: formData.fullName.trim(),
      role: formData.role,
      status: formData.status,
    });
    setIsSubmitting(false);
    if (success) {
      setIsCreateModalOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formData.username.trim() || !formData.fullName.trim()) {
      triggerToast('Username dan Nama Lengkap wajib diisi!', 'warning');
      return;
    }
    setIsSubmitting(true);
    const payload: Partial<AppUser> & { id: string } = {
      id: selectedUser.id,
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      role: formData.role,
      status: formData.status,
    };
    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }
    const success = await updateUser(payload);
    setIsSubmitting(false);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    const success = await deleteUser(selectedUser.id);
    setIsSubmitting(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="flex flex-col gap-24">
      {/* Header */}
      <div className="flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Manajemen User</span>
          </div>
          <h1 className="page-title flex align-center gap-10">
            <Users size={26} color="var(--primary-500)" /> Manajemen User & Password
          </h1>
          <p className="page-description">Kelola akun admin, username, password, dan status hak akses pengguna Gosball.</p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <UserPlus size={16} /> Tambah User Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Total User Admin</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--white)' }}>{totalUsers}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Status Aktif</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--white)' }}>{activeUsers}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Non-Aktif</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--white)' }}>{inactiveUsers}</div>
          </div>
        </div>
      </div>

      {/* Filter & Controls */}
      <div className="card flex justify-between align-center gap-16" style={{ flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau username..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex align-center gap-12">
          <span style={{ fontSize: 13, color: 'var(--neutral-400)', fontWeight: 600 }}>Role:</span>
          <select
            className="form-select"
            style={{ width: 180 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Semua Role</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin Data">Admin Data</option>
            <option value="Match Editor">Match Editor</option>
            <option value="Rumor Editor">Rumor Editor</option>
            <option value="Reviewer">Reviewer</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--navy-800)', backgroundColor: 'var(--navy-900)', color: 'var(--neutral-400)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>User / Nama Lengkap</th>
                <th style={{ padding: '14px 20px' }}>Username</th>
                <th style={{ padding: '14px 20px' }}>Role Admin</th>
                <th style={{ padding: '14px 20px' }}>Password</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--neutral-500)' }}>
                    Tidak ada data user yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPasswordVisible = !!showPassword[u.id];
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--navy-900)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="flex align-center gap-12">
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14 }}>
                            {u.fullName[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--white)' }}>{u.fullName}</div>
                            <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-400)' }}>
                        @{u.username}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge ${
                          u.role === 'Super Admin' ? 'badge-danger' :
                          u.role === 'Admin Data' ? 'badge-success' :
                          u.role === 'Match Editor' ? 'badge-info' :
                          u.role === 'Rumor Editor' ? 'badge-warning' : 'badge-draft'
                        }`}>
                          <Shield size={12} style={{ marginRight: 4 }} /> {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div className="flex align-center gap-8">
                          <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--neutral-300)' }}>
                            {isPasswordVisible ? u.password || '••••••••' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(u.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 2 }}
                            title={isPasswordVisible ? 'Sembunyikan' : 'Lihat Password'}
                          >
                            {isPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        {u.status === 'active' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Aktif
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={12} /> Non-Aktif
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div className="flex justify-end gap-8">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User & Password"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ color: 'var(--danger-500)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            onClick={() => handleOpenDelete(u)}
                            title="Hapus User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--navy-950)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--navy-800)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div className="flex justify-between align-center" style={{ padding: '16px 20px', borderBottom: '1px solid var(--navy-800)' }}>
              <div className="flex align-center gap-10">
                <UserPlus size={20} color="var(--primary-500)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--white)' }}>Tambah User Admin Baru</h3>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer' }} onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Subagja"
                  className="form-input"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ahmad_editor"
                  className="form-input"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password baru..."
                    className="form-input"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Key size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-500)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role Akses</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin Data">Admin Data</option>
                  <option value="Match Editor">Match Editor</option>
                  <option value="Rumor Editor">Rumor Editor</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Akun</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-Aktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-12" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--navy-950)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--navy-800)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div className="flex justify-between align-center" style={{ padding: '16px 20px', borderBottom: '1px solid var(--navy-800)' }}>
              <div className="flex align-center gap-10">
                <Edit2 size={20} color="var(--primary-500)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--white)' }}>Edit User @{selectedUser.username}</h3>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer' }} onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ganti Password (Opsional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak ingin mengubah password..."
                    className="form-input"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Key size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-500)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role Akses</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin Data">Admin Data</option>
                  <option value="Match Editor">Match Editor</option>
                  <option value="Rumor Editor">Rumor Editor</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Akun</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-Aktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-12" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Data User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, backgroundColor: 'var(--navy-950)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--navy-800)', boxShadow: 'var(--shadow-lg)', padding: 24 }}>
            <div className="flex align-center gap-12" style={{ marginBottom: 16, color: 'var(--danger-500)' }}>
              <Trash2 size={24} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--white)' }}>Konfirmasi Hapus User</h3>
            </div>
            <p style={{ color: 'var(--neutral-300)', fontSize: 14, marginBottom: 20 }}>
              Apakah Anda yakin ingin menghapus user <strong style={{ color: 'white' }}>{selectedUser.fullName} (@{selectedUser.username})</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-12">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Batal</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger-600)', borderColor: 'var(--danger-600)' }} onClick={handleDeleteSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
