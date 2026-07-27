'use client';

import React, { useState, useMemo } from 'react';
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
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from 'lucide-react';

type SortField = 'fullName' | 'username' | 'role' | 'status' | 'id';
type SortOrder = 'asc' | 'desc';

export default function UserManagementView() {
  const { users, mediaTenants, currentTenantId, addUser, updateUser, deleteUser, triggerToast } = useApp();

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Datatable Sorting & Pagination states
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    tenantId: currentTenantId || 'gosball',
  });

  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleShowPassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'Match Editor',
      status: 'active',
      tenantId: currentTenantId || mediaTenants[0]?.id || 'gosball',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId || 'gosball',
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
      tenantId: formData.tenantId,
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
      tenantId: formData.tenantId,
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

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Filtered & Sorted users
  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch =
          u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortOrder]);

  // Datatable Pagination Math
  const totalEntries = filteredAndSortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;

  const isFilterActive = searchTerm !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Manajemen User</span>
          </div>
          <h1 className="page-title">Manajemen User & Password</h1>
          <p className="page-description">Kelola akun admin, username, password, dan status hak akses pengguna Gosball.</p>
        </div>
        <button className="btn btn-md btn-primary" onClick={handleOpenCreate}>
          <UserPlus size={16} /> Tambah User Baru
        </button>
      </div>

      {/* ── Summary Stats — schedule-flow-grid pattern ── */}
      <div className="schedule-flow-grid">
        <div className="schedule-flow-card">
          <Users size={18} />
          <div>
            <span>Total User Admin</span>
            <strong>{totalUsers}</strong>
          </div>
        </div>
        <div className="schedule-flow-card">
          <UserCheck size={18} style={{ color: '#16a34a' }} />
          <div>
            <span>Status Aktif</span>
            <strong style={{ color: '#16a34a' }}>{activeUsers}</strong>
          </div>
        </div>
        <div className="schedule-flow-card">
          <UserX size={18} style={{ color: 'var(--danger-600)' }} />
          <div>
            <span>Non-Aktif</span>
            <strong style={{ color: 'var(--danger-600)' }}>{inactiveUsers}</strong>
          </div>
        </div>
      </div>


      {/* ── Filter Bar ── */}
      <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input
            type="text"
            placeholder="Cari nama, username, ID user..."
            className="form-input"
            style={{ paddingLeft: 30, paddingRight: searchTerm ? 32 : 12 }}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="ALL">Semua Role</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Admin Data">Admin Data</option>
          <option value="Match Editor">Match Editor</option>
          <option value="Rumor Editor">Rumor Editor</option>
          <option value="Reviewer">Reviewer</option>
        </select>

        {/* Status Filter */}
        <select
          className="form-select"
          style={{ maxWidth: 150 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="ALL">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Non-Aktif</option>
        </select>

        {isFilterActive && (
          <button className="btn btn-sm btn-secondary" onClick={resetFilters}>
            <RotateCcw size={14} /> Reset
          </button>
        )}
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{totalEntries} user</span>
      </div>

      {/* ── Datatable ── */}

      <div className="table-wrapper master-table-wrapper">
        <table className="data-table master-card-table">
          <thead>
            <tr>
                
                {/* Column: User / Nama Lengkap */}
                <th
                  onClick={() => handleSort('fullName')}
                  style={{ padding: '14px 20px', cursor: 'pointer', userSelect: 'none', color: '#1e293b' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>User / Nama Lengkap</span>
                    {sortField === 'fullName' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* Column: Username */}
                <th
                  onClick={() => handleSort('username')}
                  style={{ padding: '14px 20px', cursor: 'pointer', userSelect: 'none', color: '#1e293b' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Username</span>
                    {sortField === 'username' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* Column: Role Admin */}
                <th
                  onClick={() => handleSort('role')}
                  style={{ padding: '14px 20px', cursor: 'pointer', userSelect: 'none', color: '#1e293b' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Role Admin</span>
                    {sortField === 'role' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* Column: Password */}
                <th style={{ padding: '14px 20px', color: '#1e293b' }}>
                  Password
                </th>

                {/* Column: Status */}
                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '14px 20px', cursor: 'pointer', userSelect: 'none', color: '#1e293b' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Status</span>
                    {sortField === 'status' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* Column: Actions */}
                <th style={{ padding: '14px 20px', textAlign: 'right', color: '#1e293b' }}>
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--neutral-500)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Users size={32} style={{ color: 'var(--neutral-300)' }} />
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--neutral-700)' }}>Tidak ada data user</div>
                      <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>Tidak ditemukan user yang sesuai dengan pencarian atau filter Anda.</div>
                      {isFilterActive && (
                        <button className="btn btn-sm btn-secondary" onClick={resetFilters} style={{ marginTop: 8 }}>
                          <RotateCcw size={14} /> Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isPasswordVisible = !!showPassword[u.id];
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--neutral-200)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* User / Full Name */}
                      <td className="master-title-cell" data-label="User" style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: 'white',
                            fontSize: 14,
                            flexShrink: 0
                          }}>
                            {u.fullName[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{u.fullName}</div>
                            <div style={{ fontSize: 11, color: 'var(--neutral-500)', fontFamily: 'monospace' }}>ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="master-info-cell" data-label="Username" style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--primary-700)',
                          backgroundColor: 'var(--primary-50)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--primary-100)',
                          fontSize: 13
                        }}>
                          @{u.username}
                        </span>
                      </td>

                      {/* Role Admin Badge */}
                      <td className="master-info-cell" data-label="Role" style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor:
                            u.role === 'Super Admin' ? 'rgba(225, 29, 72, 0.1)' :
                            u.role === 'Admin Data' ? 'rgba(16, 185, 129, 0.1)' :
                            u.role === 'Match Editor' ? 'rgba(37, 99, 235, 0.1)' :
                            u.role === 'Rumor Editor' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color:
                            u.role === 'Super Admin' ? '#e11d48' :
                            u.role === 'Admin Data' ? '#059669' :
                            u.role === 'Match Editor' ? '#2563eb' :
                            u.role === 'Rumor Editor' ? '#d97706' : '#475569',
                          border: `1px solid ${
                            u.role === 'Super Admin' ? 'rgba(225, 29, 72, 0.2)' :
                            u.role === 'Admin Data' ? 'rgba(16, 185, 129, 0.2)' :
                            u.role === 'Match Editor' ? 'rgba(37, 99, 235, 0.2)' :
                            u.role === 'Rumor Editor' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(100, 116, 139, 0.2)'
                          }`
                        }}>
                          <Shield size={12} /> {u.role}
                        </span>
                      </td>

                      {/* Password Cell */}
                      <td className="master-info-cell" data-label="Password" style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#334155', fontWeight: isPasswordVisible ? 600 : 400 }}>
                            {isPasswordVisible ? u.password || '••••••••' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(u.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
                            title={isPasswordVisible ? 'Sembunyikan Password' : 'Lihat Password'}
                          >
                            {isPasswordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="master-info-cell" data-label="Status" style={{ padding: '14px 20px' }}>
                        {u.status === 'active' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: 'rgba(34, 197, 94, 0.12)',
                            color: '#15803d',
                            border: '1px solid rgba(34, 197, 94, 0.25)'
                          }}>
                            <CheckCircle size={12} /> Aktif
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            color: '#b91c1c',
                            border: '1px solid rgba(239, 68, 68, 0.25)'
                          }}>
                            <AlertCircle size={12} /> Non-Aktif
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="master-actions-cell text-right" data-label="Aksi" style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div className="master-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenEdit(u)}
                            style={{ height: 32, padding: '0 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                            title="Edit User & Password"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleOpenDelete(u)}
                            style={{
                              height: 32,
                              padding: '0 12px',
                              fontSize: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontWeight: 600,
                              color: '#e11d48',
                              backgroundColor: 'rgba(225, 29, 72, 0.06)',
                              border: '1px solid rgba(225, 29, 72, 0.25)',
                              borderRadius: 'var(--radius-sm)'
                            }}
                            title="Hapus User"
                          >
                            <Trash2 size={13} /> Hapus
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

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
            Menampilkan <strong>{totalEntries > 0 ? startIndex + 1 : 0}</strong>–<strong>{endIndex}</strong> dari <strong>{totalEntries}</strong> user
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>Tampilkan:</span>
            <select
              className="form-select"
              style={{ height: 32, fontSize: 12, padding: '0 24px 0 8px' }}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
            <ChevronsLeft size={15} />
          </button>
          <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), currentPage + 2).map(page => (
            <button key={page} className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: 32, padding: '0 8px', fontSize: 13 }} onClick={() => setCurrentPage(page)}>
              {page}
            </button>
          ))}
          <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
            <ChevronRight size={15} />
          </button>
          <button className="btn btn-sm btn-secondary" style={{ width: 32, padding: 0, justifyContent: 'center' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--neutral-200)', backgroundColor: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(22, 163, 74, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#14532d' }}>Tambah User Admin Baru</h3>
                  <div style={{ fontSize: 11, color: '#16a34a', marginTop: 1 }}>Isi semua field yang diperlukan</div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4, borderRadius: 4 }} onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form id="form-create-user" onSubmit={handleCreateSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Subagja"
                  className="form-input"
                  style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 12px' }}
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Username</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ahmad_editor"
                  className="form-input"
                  style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 12px' }}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword['create'] ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password baru..."
                    className="form-input"
                    style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 38px 0 12px', width: '100%', boxSizing: 'border-box' }}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('create')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
                    title={showPassword['create'] ? 'Sembunyikan Password' : 'Lihat Password'}
                  >
                    {showPassword['create'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Role Akses</label>
                  <select
                    className="form-select"
                    style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 28px 0 10px', width: '100%', boxSizing: 'border-box' }}
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
                  <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Status Akun</label>
                  <select
                    className="form-select"
                    style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 28px 0 10px', width: '100%', boxSizing: 'border-box' }}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--neutral-200)', backgroundColor: '#fafaf9', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-create-user"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <UserPlus size={15} />
                {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--neutral-200)', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                  <Edit2 size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e3a8a' }}>Edit User Admin</h3>
                  <div style={{ fontSize: 11, color: '#2563eb', marginTop: 1, fontFamily: 'monospace', fontWeight: 700 }}>@{selectedUser.username}</div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4, borderRadius: 4 }} onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form id="form-edit-user" onSubmit={handleEditSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 12px' }}
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Username</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 12px' }}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>
                  Ganti Password
                  <span style={{ fontWeight: 400, color: 'var(--neutral-500)', fontSize: 11, marginLeft: 6 }}>(opsional — kosongkan jika tidak diubah)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword['edit'] ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 38px 0 12px', width: '100%', boxSizing: 'border-box' }}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('edit')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
                    title={showPassword['edit'] ? 'Sembunyikan' : 'Lihat Password'}
                  >
                    {showPassword['edit'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Role Akses</label>
                  <select
                    className="form-select"
                    style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 28px 0 10px', width: '100%', boxSizing: 'border-box' }}
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
                  <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Status Akun</label>
                  <select
                    className="form-select"
                    style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 28px 0 10px', width: '100%', boxSizing: 'border-box' }}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: 13 }}>Media Tenant Workspace</label>
                <select
                  className="form-select"
                  style={{ backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, height: 40, fontSize: 14, padding: '0 28px 0 10px', width: '100%', boxSizing: 'border-box' }}
                  value={formData.tenantId}
                  onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                >
                  {mediaTenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.handle})
                    </option>
                  ))}
                </select>
              </div>
            </form>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--neutral-200)', backgroundColor: '#fafaf9', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-edit-user"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Edit2 size={15} />
                {isSubmitting ? 'Menyimpan...' : 'Perbarui Data User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL (MATCHED WITH SCHEDULE & MATCH RESULT MODAL DESIGN) */}
      {isDeleteModalOpen && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 440, backgroundColor: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--neutral-200)', backgroundColor: '#fff1f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(225, 29, 72, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#9f1239' }}>Konfirmasi Hapus User</h3>
                  <div style={{ fontSize: 11, color: '#be123c', marginTop: 1 }}>Tindakan ini tidak dapat dibatalkan</div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4 }} onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 20 }}>
              <p style={{ color: '#334155', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Apakah Anda yakin ingin menghapus akun user <strong style={{ color: '#0f172a' }}>{selectedUser.fullName}</strong> (<span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-700)' }}>@{selectedUser.username}</span>)?
              </p>

              <div style={{ marginTop: 14, padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecdd3', borderRadius: 8, fontSize: 12, color: '#9f1239', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Pengguna ini akan kehilangan hak akses ke seluruh sistem Gosball Media Tools.</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--neutral-200)', backgroundColor: '#fafaf9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}
              >
                Batal
              </button>
              <button
                className="btn"
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                  backgroundColor: '#e11d48',
                  borderColor: '#e11d48',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Trash2 size={15} />
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
