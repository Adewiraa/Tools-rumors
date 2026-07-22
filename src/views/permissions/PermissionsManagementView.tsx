'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/logic/AppContext';
import { UserRole, ActiveMenu, ALL_MENUS, RolePermission, INITIAL_ROLE_PERMISSIONS } from '@/lib/types/auth';
import { Shield, Lock, Save, RefreshCw, ChevronRight, Check, AlertCircle } from 'lucide-react';

const ROLES: UserRole[] = [
  'Super Admin',
  'Admin Data',
  'Match Editor',
  'Rumor Editor',
  'Reviewer',
];

export default function PermissionsManagementView() {
  const { rolePermissions, saveRolePermissions, currentUserRole, triggerToast } = useApp();

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
    <div className="flex flex-col gap-24">
      {/* Header */}
      <div className="flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Manajemen Hak Akses</span>
          </div>
          <h1 className="page-title flex align-center gap-10">
            <Lock size={26} color="var(--primary-500)" /> Manajemen Hak Akses Menu
          </h1>
          <p className="page-description">Atur dan batasi menu aplikasi yang boleh dibuka oleh masing-masing Role Admin.</p>
        </div>

        <div className="flex align-center gap-12">
          <button className="btn btn-secondary" onClick={handleResetDefault}>
            <RefreshCw size={16} /> Reset Default
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--warning-600)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--warning-500)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} /> Ada perubahan hak akses menu yang belum disimpan. Klik tombol &quot;Simpan Hak Akses&quot; untuk menerapkan.
        </div>
      )}

      {/* Permissions Matrix Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--navy-800)', backgroundColor: 'var(--navy-900)', color: 'var(--neutral-400)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '16px 20px', minWidth: 220 }}>Modul / Menu Aplikasi</th>
                {ROLES.map(role => (
                  <th key={role} style={{ padding: '16px 20px', textAlign: 'center', minWidth: 140 }}>
                    <div className="flex flex-col align-center gap-4">
                      <span className={`badge ${
                        role === 'Super Admin' ? 'badge-danger' :
                        role === 'Admin Data' ? 'badge-success' :
                        role === 'Match Editor' ? 'badge-info' :
                        role === 'Rumor Editor' ? 'badge-warning' : 'badge-draft'
                      }`}>
                        <Shield size={12} style={{ marginRight: 4 }} /> {role}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(category => {
                const categoryMenus = ALL_MENUS.filter(m => m.category === category);
                return (
                  <React.Fragment key={category}>
                    <tr style={{ backgroundColor: 'var(--navy-950)', borderBottom: '1px solid var(--navy-900)' }}>
                      <td colSpan={ROLES.length + 1} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--primary-500)' }}>
                        {category}
                      </td>
                    </tr>

                    {categoryMenus.map(menu => (
                      <tr key={menu.id} style={{ borderBottom: '1px solid var(--navy-900)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--white)' }}>
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
      <div className="card" style={{ backgroundColor: 'var(--navy-900)', border: '1px solid var(--navy-800)' }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }} className="flex align-center gap-8">
          <Shield size={16} color="var(--primary-500)" /> Penjelasan Hak Akses Role
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--neutral-400)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><strong style={{ color: 'white' }}>Super Admin:</strong> Memiliki izin penuh (100%) ke seluruh menu dan modul tanpa batasan.</li>
          <li><strong style={{ color: 'white' }}>Matriks Menu:</strong> Memungkinkan Anda untuk menyesuaikan navigasi sidebar dan akses route per role secara real-time.</li>
          <li><strong style={{ color: 'white' }}>Auto-Filter Navigasi:</strong> Ketika role tertentu aktif di header/sistem, menu yang dicentang di sini yang akan muncul di Sidebar.</li>
        </ul>
      </div>
    </div>
  );
}
