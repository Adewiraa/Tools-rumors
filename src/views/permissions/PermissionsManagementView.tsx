'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/logic/AppContext';
import { UserRole, ActiveMenu, ALL_MENUS, RolePermission, INITIAL_ROLE_PERMISSIONS } from '@/lib/types/auth';
import { Shield, Lock, Save, RefreshCw, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const ROLES: UserRole[] = [
  'Super Admin',
  'Admin Data',
  'Match Editor',
  'Rumor Editor',
  'Reviewer',
];

const ROLE_COLOR: Record<UserRole, { bg: string; color: string; border: string }> = {
  'Super Admin':  { bg: 'rgba(225, 29, 72, 0.08)',   color: '#e11d48', border: 'rgba(225, 29, 72, 0.2)' },
  'Admin Data':   { bg: 'rgba(16, 185, 129, 0.08)',  color: '#059669', border: 'rgba(16, 185, 129, 0.2)' },
  'Match Editor': { bg: 'rgba(37, 99, 235, 0.08)',   color: '#2563eb', border: 'rgba(37, 99, 235, 0.2)' },
  'Rumor Editor': { bg: 'rgba(217, 119, 6, 0.08)',   color: '#d97706', border: 'rgba(217, 119, 6, 0.2)' },
  'Reviewer':     { bg: 'rgba(100, 116, 139, 0.08)', color: '#475569', border: 'rgba(100, 116, 139, 0.2)' },
};

export default function PermissionsManagementView() {
  const { rolePermissions, saveRolePermissions, triggerToast } = useApp();

  const [matrix, setMatrix] = useState<RolePermission[]>(rolePermissions);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setMatrix(rolePermissions);
  }, [rolePermissions]);

  const isMenuAllowed = (role: UserRole, menuId: ActiveMenu): boolean => {
    if (role === 'Super Admin') return true;
    const perm = matrix.find(p => p.role === role);
    if (!perm) return false;
    return perm.allowedMenus.includes(menuId);
  };

  const togglePermission = (role: UserRole, menuId: ActiveMenu) => {
    if (role === 'Super Admin') return;
    setMatrix(prev =>
      prev.map(p => {
        if (p.role !== role) return p;
        const exists = p.allowedMenus.includes(menuId);
        return {
          ...p,
          allowedMenus: exists
            ? p.allowedMenus.filter(m => m !== menuId)
            : [...p.allowedMenus, menuId],
        };
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveRolePermissions(matrix);
    setIsSaving(false);
    if (success) setHasChanges(false);
  };

  const handleResetDefault = () => {
    setMatrix(INITIAL_ROLE_PERMISSIONS);
    setHasChanges(true);
    triggerToast('Matriks dikembalikan ke preset default (Belum disimpan)', 'warning');
  };

  const categories = Array.from(new Set(ALL_MENUS.map(m => m.category)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>Manajemen Hak Akses</span>
          </div>
          <h1 className="page-title">Manajemen Hak Akses Menu</h1>
          <p className="page-description">Atur dan batasi menu aplikasi yang boleh dibuka oleh masing-masing Role Admin.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'flex-start' }}>
          <button className="btn btn-md btn-secondary" onClick={handleResetDefault}>
            <RefreshCw size={15} /> Reset Default
          </button>
          <button className="btn btn-md btn-primary" onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save size={15} /> {isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}
          </button>
        </div>
      </div>

      {/* ── Unsaved Changes Alert ── */}
      {hasChanges && (
        <div className="card" style={{ padding: '12px 20px', backgroundColor: '#fffbeb', borderColor: '#fde68a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
            Ada perubahan hak akses yang belum disimpan. Klik <strong>&quot;Simpan Hak Akses&quot;</strong> untuk menerapkan.
          </span>
        </div>
      )}

      {/* ── Permissions Matrix Table ── */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Modul / Menu Aplikasi</th>
              {ROLES.map(role => {
                const rc = ROLE_COLOR[role];
                return (
                  <th key={role} style={{ textAlign: 'center', minWidth: 130 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: rc.bg,
                      color: rc.color,
                      border: `1px solid ${rc.border}`,
                    }}>
                      <Shield size={11} /> {role}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {categories.map(category => {
              const categoryMenus = ALL_MENUS.filter(m => m.category === category);
              return (
                <React.Fragment key={category}>
                  {/* Category Header Row */}
                  <tr>
                    <td colSpan={ROLES.length + 1} style={{
                      padding: '8px 16px',
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: 'var(--primary-700)',
                      backgroundColor: 'var(--neutral-50)',
                      borderBottom: '1px solid var(--neutral-200)',
                    }}>
                      {category}
                    </td>
                  </tr>

                  {categoryMenus.map(menu => (
                    <tr key={menu.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{menu.label}</td>

                      {ROLES.map(role => {
                        const allowed = isMenuAllowed(role, menu.id);
                        const isSuperAdmin = role === 'Super Admin';

                        return (
                          <td key={role} style={{ textAlign: 'center' }}>
                            <label style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: isSuperAdmin ? 'not-allowed' : 'pointer',
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              transition: 'background 0.15s',
                            }}
                              title={isSuperAdmin ? 'Super Admin selalu memiliki akses penuh' : allowed ? 'Klik untuk cabut akses' : 'Klik untuk beri akses'}
                            >
                              {isSuperAdmin ? (
                                <CheckCircle size={20} style={{ color: '#059669' }} />
                              ) : allowed ? (
                                <CheckCircle
                                  size={20}
                                  style={{ color: '#059669', cursor: 'pointer' }}
                                  onClick={() => togglePermission(role, menu.id)}
                                />
                              ) : (
                                <XCircle
                                  size={20}
                                  style={{ color: 'var(--neutral-300)', cursor: 'pointer' }}
                                  onClick={() => togglePermission(role, menu.id)}
                                />
                              )}
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Info Card ── */}
      <div className="card">
        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: 'var(--neutral-950)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: 'var(--primary-600)' }} /> Penjelasan Hak Akses Role
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--neutral-700)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><strong style={{ color: 'var(--neutral-950)' }}>Super Admin:</strong> Memiliki izin penuh (100%) ke seluruh menu dan modul tanpa batasan.</li>
          <li><strong style={{ color: 'var(--neutral-950)' }}>Matriks Menu:</strong> Menyesuaikan navigasi sidebar dan akses route per role secara real-time.</li>
          <li><strong style={{ color: 'var(--neutral-950)' }}>Auto-Filter Navigasi:</strong> Menu yang dicentang di sini yang akan muncul di Sidebar untuk role tersebut.</li>
        </ul>
      </div>
    </div>
  );
}
