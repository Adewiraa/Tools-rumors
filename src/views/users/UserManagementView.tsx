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
  Key,
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
  SlidersHorizontal
} from 'lucide-react';

type SortField = 'fullName' | 'username' | 'role' | 'status' | 'id';
type SortOrder = 'asc' | 'desc';

export default function UserManagementView() {
  const { users, addUser, updateUser, deleteUser, triggerToast } = useApp();

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
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="breadcrumb" style={{ fontSize: 12, color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span>Dashboard</span> <ChevronRight size={10} /> <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>Manajemen User</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={26} style={{ color: 'var(--primary-600)' }} /> Manajemen User & Password
          </h1>
          <p style={{ fontSize: 13, color: 'var(--neutral-700)', margin: '4px 0 0 0' }}>
            Kelola akun admin, username, password, dan status hak akses pengguna Gosball.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 700, fontSize: 14 }}>
          <UserPlus size={18} /> Tambah User Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(102, 117, 106, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total User Admin</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 2 }}>{totalUsers}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status Aktif</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', lineHeight: 1.2, marginTop: 2 }}>{activeUsers}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Non-Aktif</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', lineHeight: 1.2, marginTop: 2 }}>{inactiveUsers}</div>
          </div>
        </div>
      </div>

      {/* DATATABLE CONTAINER CARD */}
      <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        
        {/* Datatable Toolbar / Controls */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--neutral-200)', backgroundColor: '#fafaf9', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 380 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-500)' }} />
              <input
                type="text"
                placeholder="Cari nama, username, ID user..."
                className="form-input"
                style={{ paddingLeft: 36, paddingRight: searchTerm ? 32 : 12, height: 38, fontSize: 13, backgroundColor: 'var(--white)' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SlidersHorizontal size={14} style={{ color: 'var(--neutral-500)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Role:</span>
                <select
                  className="form-select"
                  style={{ height: 38, fontSize: 13, minWidth: 140, paddingRight: 28, backgroundColor: 'var(--white)' }}
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
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Status:</span>
                <select
                  className="form-select"
                  style={{ height: 38, fontSize: 13, minWidth: 130, paddingRight: 28, backgroundColor: 'var(--white)' }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-Aktif</option>
                </select>
              </div>

              {isFilterActive && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={resetFilters}
                  style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--neutral-700)' }}
                  title="Reset Filter"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Datatable Table Body */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--neutral-200)', color: '#334155', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                
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
                      <td style={{ padding: '14px 20px' }}>
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
                      <td style={{ padding: '14px 20px' }}>
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
                      <td style={{ padding: '14px 20px' }}>
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
                      <td style={{ padding: '14px 20px' }}>
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
                      <td style={{ padding: '14px 20px' }}>
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
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
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

        {/* Datatable Footer / Pagination */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--neutral-200)', backgroundColor: '#fafaf9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          
          {/* Entries Info & Rows Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
              Menampilkan <strong style={{ color: '#0f172a' }}>{totalEntries > 0 ? startIndex + 1 : 0}</strong> - <strong style={{ color: '#0f172a' }}>{endIndex}</strong> dari <strong style={{ color: '#0f172a' }}>{totalEntries}</strong> user
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>Tampilkan:</span>
              <select
                className="form-select"
                style={{ height: 32, fontSize: 12, padding: '0 24px 0 8px', backgroundColor: 'var(--white)' }}
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

          {/* Page Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-sm btn-secondary"
              style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="Halaman Pertama"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="btn btn-sm btn-secondary"
              style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number Indicators */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: 32, minWidth: 32, padding: '0 8px', fontSize: 13, fontWeight: currentPage === page ? 700 : 400 }}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="btn btn-sm btn-secondary"
              style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              title="Halaman Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="btn btn-sm btn-secondary"
              style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Halaman Terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
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
