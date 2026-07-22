'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/logic/AppContext';
import { UserRole, ActiveMenu, ALL_MENUS, RolePermission, INITIAL_ROLE_PERMISSIONS } from '@/lib/types/auth';
import { Shield, Lock, Save, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';

const ROLES: UserRole[] = [
  'Super Admin',
  'Admin Data',
  'Match Editor',
  'Rumor Editor',
  'Reviewer',
];

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
    if (role === 'Super Admin') return; // Locked

    setMatrix(prev => {
      return prev.map(p => {
        if (p.role !== role) return p;
        const exists = p.allowedMenus.includes(menuId);
        const nextAllowed = exists
          ? p.allowedMenus.filter(m => m !== menuId)
          : [...p.allowedMenus, menuId];
        return {
          ...p,
          allowedMenus: nextAllowed,
        };
      });
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveRolePermissions(matrix);
    setIsSaving(false);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleResetDefault = () => {
    setMatrix(INITIAL_ROLE_PERMISSIONS);
    setHasChanges(true);
    triggerToast('Matriks dikembalikan ke preset default (Belum disimpan)', 'warning');
  };

  // Group menus by category
  const categories = Array.from(new Set(ALL_MENUS.map(m => m.category)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="breadcrumb" style={{ fontSize: 12, color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span>Dashboard</span> <ChevronRight size={10} /> <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>Manajemen Hak Akses</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={26} style={{ color: 'var(--primary-600)' }} /> Manajemen Hak Akses Menu
          </h1>
          <p style={{ fontSize: 13, color: 'var(--neutral-700)', margin: '4px 0 0 0' }}>
            Atur dan batasi menu aplikasi yang boleh dibuka oleh masing-masing Role Admin.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleResetDefault} style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} /> Reset Default
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !hasChanges} style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.12)', border: '1px solid #ca8a04', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: '#a16207', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} /> Ada perubahan hak akses menu yang belum disimpan. Klik tombol &quot;Simpan Hak Akses&quot; untuk menerapkan.
        </div>
      )}

      {/* Permissions Matrix Card */}
      <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--neutral-200)', color: '#334155', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <th style={{ padding: '16px 20px', minWidth: 240, color: '#1e293b' }}>Modul / Menu Aplikasi</th>
                {ROLES.map(role => (
                  <th key={role} style={{ padding: '16px 20px', textAlign: 'center', minWidth: 140 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor:
                        role === 'Super Admin' ? 'rgba(225, 29, 72, 0.1)' :
                        role === 'Admin Data' ? 'rgba(16, 185, 129, 0.1)' :
                        role === 'Match Editor' ? 'rgba(37, 99, 235, 0.1)' :
                        role === 'Rumor Editor' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color:
                        role === 'Super Admin' ? '#e11d48' :
                        role === 'Admin Data' ? '#059669' :
                        role === 'Match Editor' ? '#2563eb' :
                        role === 'Rumor Editor' ? '#d97706' : '#475569',
                      border: `1px solid ${
                        role === 'Super Admin' ? 'rgba(225, 29, 72, 0.2)' :
                        role === 'Admin Data' ? 'rgba(16, 185, 129, 0.2)' :
                        role === 'Match Editor' ? 'rgba(37, 99, 235, 0.2)' :
                        role === 'Rumor Editor' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(100, 116, 139, 0.2)'
                      }`
                    }}>
                      <Shield size={12} /> {role}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(category => {
                const categoryMenus = ALL_MENUS.filter(m => m.category === category);
                return (
                  <React.Fragment key={category}>
                    <tr style={{ backgroundColor: '#fafaf9', borderBottom: '1px solid var(--neutral-200)' }}>
                      <td colSpan={ROLES.length + 1} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--primary-700)' }}>
                        {category}
                      </td>
                    </tr>

                    {categoryMenus.map(menu => (
                      <tr
                        key={menu.id}
                        style={{ borderBottom: '1px solid var(--neutral-200)', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                          {menu.label}
                        </td>

                        {ROLES.map(role => {
                          const allowed = isMenuAllowed(role, menu.id);
                          const isSuperAdmin = role === 'Super Admin';

                          return (
                            <td key={role} style={{ padding: '14px 20px', textAlign: 'center' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: isSuperAdmin ? 'not-allowed' : 'pointer' }}>
                                <input
                                  type="checkbox"
                                  disabled={isSuperAdmin}
                                  checked={allowed}
                                  onChange={() => togglePermission(role, menu.id)}
                                  style={{
                                    width: 18,
                                    height: 18,
                                    accentColor: 'var(--primary-600)',
                                    cursor: isSuperAdmin ? 'not-allowed' : 'pointer'
                                  }}
                                />
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
      </div>

      {/* Explanatory Info Card */}
      <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: 'var(--primary-600)' }} /> Penjelasan Hak Akses Role
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--neutral-700)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><strong style={{ color: '#0f172a' }}>Super Admin:</strong> Memiliki izin penuh (100%) ke seluruh menu dan modul tanpa batasan.</li>
          <li><strong style={{ color: '#0f172a' }}>Matriks Menu:</strong> Memungkinkan Anda untuk menyesuaikan navigasi sidebar dan akses route per role secara real-time.</li>
          <li><strong style={{ color: '#0f172a' }}>Auto-Filter Navigasi:</strong> Ketika role tertentu aktif di header/sistem, menu yang dicentang di sini yang akan muncul di Sidebar.</li>
        </ul>
      </div>
    </div>
  );
}
