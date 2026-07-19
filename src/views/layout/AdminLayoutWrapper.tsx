'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp, UserRole } from '@/logic/AppContext';
import {
  Search,
  Bell,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
  Shield,
  History,
  User,
  Settings,
  LogOut,
  Trophy,
  Menu,
  Activity,
  Calendar,
  FileText,
  Radio
} from 'lucide-react';
import { DatabaseIcon, SkeletonLoading, ErrorState } from '../shared/StateComponents';
import {
  APP_NAME,
  APP_LOGO_SRC,
  getEffectiveLineupStatus,
  getEffectiveMatchStatus
} from '@/logic/utils';

type NavSection = {
  title: string;
  items: { id: string; label: string; icon: React.ElementType; mobileHidden?: boolean }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Menu Utama',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: Activity }],
  },
  {
    title: 'Pertandingan',
    items: [
      { id: 'schedule', label: 'Jadwal Pertandingan', icon: Calendar },
      { id: 'lineups', label: 'Lineup Tim', icon: FileText },
      { id: 'results', label: 'Hasil Pertandingan', icon: Trophy },
    ],
  },
  {
    title: 'Editorial',
    items: [{ id: 'rumors', label: 'Rumor & Transfer', icon: Radio }],
  },
  {
    title: 'Master Data',
    items: [
      { id: 'clubs', label: 'Master Klub', icon: Shield, mobileHidden: true },
      { id: 'players', label: 'Master Pemain', icon: User, mobileHidden: true },
      { id: 'competitions', label: 'Master Kompetisi', icon: Trophy, mobileHidden: true },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { id: 'logs', label: 'Audit Log', icon: History, mobileHidden: true },
      { id: 'settings', label: 'Pengaturan', icon: Settings, mobileHidden: true },
    ],
  },
];

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeMenu = pathname.split('/')[1] || 'dashboard';

  const {
    matches,
    currentUserRole,
    uiState,
    setUiState,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isOffline,
    toast,
    triggerToast,
    globalSearchOpen,
    setGlobalSearchOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    hasPermission
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ matches: any[], players: any[], clubs: any[] }>({ matches: [], players: [], clubs: [] });
  const [searchTerm, setSearchTerm] = useState('');

  // Renders role permissions label badge
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Super Admin': return <span className="badge badge-danger"><Shield size={12} /> Super Admin</span>;
      case 'Admin Data': return <span className="badge badge-success"><DatabaseIcon size={12} /> Admin Data</span>;
      case 'Match Editor': return <span className="badge badge-info"><Trophy size={12} /> Match Editor</span>;
      case 'Rumor Editor': return <span className="badge badge-warning"><Radio size={12} /> Rumor Editor</span>;
      case 'Reviewer': return <span className="badge badge-draft"><CheckCircle size={12} /> Reviewer</span>;
    }
  };

  // Keyboard shortcut listener for Global Search (Ctrl/Cmd + K or "/")
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchOpen]);

  // Handle Quick Create button click
  const handleQuickCreate = () => {
    if (activeMenu === 'schedule') {
      router.push('/schedule?edit=new');
    } else if (activeMenu === 'lineups') {
      router.push('/schedule?edit=new');
      triggerToast('Buat jadwal pertandingan terlebih dahulu. Lineup mengikuti ID jadwal.', 'warning');
    } else if (activeMenu === 'results') {
      const readyMatch = matches.find(m => getEffectiveLineupStatus(m) === 'Complete' && getEffectiveMatchStatus(m) === 'Live');
      if (readyMatch) {
        router.push(`/results?edit=${readyMatch.id}`);
      } else {
        triggerToast('Input hasil hanya tersedia untuk pertandingan Live yang lineup-nya lengkap.', 'warning');
      }
    } else if (activeMenu === 'rumors') {
      router.push('/rumors?edit=new');
    } else if (activeMenu === 'clubs') {
      router.push('/clubs?edit=new');
    } else if (activeMenu === 'players') {
      router.push('/players?edit=new');
    } else if (activeMenu === 'competitions') {
      router.push('/competitions?edit=new');
    } else {
      router.push('/schedule?edit=new');
    }
  };

  const handleMenuNavigate = (event: React.MouseEvent<HTMLAnchorElement>, menuId: string) => {
    event.preventDefault();
    setMobileDrawerOpen(false);
    router.replace(`/${menuId}`);
  };

  return (
    <div className="app-container">
      {/* Dynamic Header Alert for Unsaved Changes or Offline status */}
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'var(--danger-600)', color: 'white', padding: '6px 20px', textAlign: 'center', zIndex: 1100, fontSize: '13px', fontWeight: 600 }}>
          <AlertCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Koneksi Internet Terputus. Aplikasi berjalan dalam mode Offline.
        </div>
      )}
      {hasUnsavedChanges && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, backgroundColor: 'var(--navy-950)', color: 'white', padding: '12px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 1100, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--primary-600)' }}>
          <div className="pulse-dot" style={{ backgroundColor: 'var(--accent-500)' }}></div>
          <span style={{ fontSize: '13px' }}>Perubahan belum disimpan.</span>
          <button className="btn btn-sm btn-primary" onClick={() => { setHasUnsavedChanges(false); triggerToast('Draft otomatis berhasil disimpan!', 'success'); }}>Simpan Draft</button>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--navy-900)' }}>
              <div className="flex align-center gap-8">
                <img src={APP_LOGO_SRC} alt={APP_NAME} style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 8, background: '#050505' }} />
                <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: 16 }}>{APP_NAME}</span>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4 }} onClick={() => setMobileDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="mobile-drawer-menu">
              {NAV_SECTIONS.map(section => (
                <div key={section.title}>
                  <div className="menu-category mobile-drawer-category">{section.title}</div>
                  {section.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={`/${item.id}`}
                        className={`menu-item mobile-drawer-item ${activeMenu === item.id ? 'active' : ''}`}
                        onClick={(event) => handleMenuNavigate(event, item.id)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--navy-900)', backgroundColor: '#111417' }}>
              <div className="flex align-center gap-8">
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: 13 }}>
                  {currentUserRole[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>Admin Gosball</div>
                  <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>{currentUserRole}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar" style={{ width: sidebarCollapsed ? '72px' : '248px' }}>
        {/* Logo + Toggle */}
        <div className="sidebar-logo">
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={APP_LOGO_SRC} alt={APP_NAME} style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8, background: '#050505', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--white)', letterSpacing: 0.3 }}>{APP_NAME}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary-600)', letterSpacing: 1, marginTop: -1 }}>MEDIA APP</div>
                </div>
              </div>
              <button onClick={() => setSidebarCollapsed(true)} style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }} title="Sembunyikan Sidebar">
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSidebarCollapsed(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }} title="Tampilkan Sidebar">
              <img src={APP_LOGO_SRC} alt={APP_NAME} style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8, background: '#050505', flexShrink: 0 }} />
            </button>
          )}
        </div>

        <nav className="sidebar-menu">
          {NAV_SECTIONS.map(section => (
            <div className="sidebar-section" key={section.title}>
              {!sidebarCollapsed && <div className="menu-category">{section.title}</div>}
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={`/${item.id}`}
                    className={`menu-item ${item.mobileHidden ? 'mobile-hidden' : ''} ${activeMenu === item.id ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
                    onClick={(event) => handleMenuNavigate(event, item.id)}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}

          <button type="button" className="menu-item mobile-more-btn" onClick={() => setMobileDrawerOpen(true)}>
            <Menu size={18} />
            <span>Lainnya</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14, flexShrink: 0 }}>
                {currentUserRole[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin Gosball</div>
                <div style={{ fontSize: 10, color: 'var(--neutral-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUserRole}</div>
              </div>
              <Link href="/settings" style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', flexShrink: 0 }} title="Pengaturan">
                <LogOut size={15} />
              </Link>
            </div>
          ) : (
            <Link href="/settings" style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14, margin: '0 auto', cursor: 'pointer' }}
              title="Pengaturan">
              {currentUserRole[0]}
            </Link>
          )}
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="flex align-center gap-16">
            <button className="btn btn-sm btn-secondary desktop-sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title="Toggle Sidebar">
              <Menu size={18} />
            </button>
            <button className="btn btn-sm btn-secondary mobile-hamburger" onClick={() => setMobileDrawerOpen(true)} title="Menu">
              <Menu size={18} />
            </button>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Cari pertandingan, pemain, klub (Shortcut: /)"
                className="form-input"
                onClick={() => setGlobalSearchOpen(true)}
                readOnly
              />
            </div>
          </div>

          <div className="flex align-center gap-16">
            {/* Quick Actions Button */}
            {hasPermission('Lineup Pertandingan', 'create_edit') && (
              <div style={{ position: 'relative' }}>
                <button className="btn btn-sm btn-primary" onClick={handleQuickCreate}>
                  <Plus size={14} /> Buat Baru
                </button>
              </div>
            )}

            {/* Notification Center */}
            <div style={{ position: 'relative' }}>
              <button className="btn btn-sm btn-secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={16} />
                <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: 'var(--danger-600)', borderRadius: '50%' }}></span>
              </button>

              {notificationsOpen && (
                <div style={{ position: 'absolute', right: 0, top: 40, width: 320, backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 120, padding: 16 }}>
                  <div className="flex justify-between align-center" style={{ marginBottom: 12, borderBottom: '1px solid var(--neutral-100)', paddingBottom: 8 }}>
                    <span className="semibold" style={{ fontSize: 14 }}>Notifikasi Masuk</span>
                    <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer' }} onClick={() => setNotificationsOpen(false)}><X size={14} /></button>
                  </div>
                  <div className="flex flex-col gap-12">
                    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--neutral-50)' }}>
                      <div className="flex align-center gap-8" style={{ marginBottom: 4 }}>
                        <span className="pulse-dot"></span>
                        <span className="semibold" style={{ fontSize: 12 }}>Bandung Cakra vs Bali Dewata</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--neutral-700)' }}>Hasil pertandingan baru selesai. Membutuhkan review skor akhir.</p>
                      <span style={{ fontSize: 10, color: 'var(--neutral-500)' }}>Baru saja</span>
                    </div>
                    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--neutral-50)' }}>
                      <div className="flex align-center gap-8" style={{ marginBottom: 4 }}>
                        <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: 10 }}>Rumor Tier D</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--neutral-700)' }}>Draft rumor baru dibuat dengan Tier D (Spekulatif) oleh Rumor Editor X.</p>
                      <span style={{ fontSize: 10, color: 'var(--neutral-500)' }}>30 menit yang lalu</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Active Role Indicator */}
            <div className="flex align-center gap-8">
              {renderRoleBadge(currentUserRole)}
            </div>
          </div>
        </header>

        {/* Toast Notification */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'success' ? 'var(--success-600)' : toast.type === 'error' ? 'var(--danger-600)' : 'var(--warning-600)', color: 'white', padding: '12px 24px', borderRadius: 'var(--radius-md)', zIndex: 2000, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Content */}
        <main className="page-container">
          {uiState === 'loading' ? (
            <SkeletonLoading />
          ) : uiState === 'error' ? (
            <ErrorState onRetry={() => setUiState('default')} />
          ) : (
            children
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      {globalSearchOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 16 }} onClick={() => setGlobalSearchOpen(false)}>
          <div style={{ width: '100%', maxWidth: 640, backgroundColor: 'var(--navy-950)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--navy-800)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex align-center gap-12" style={{ padding: 16, borderBottom: '1px solid var(--navy-800)' }}>
              <Search size={18} color="var(--neutral-400)" />
              <input
                autoFocus
                type="text"
                placeholder="Cari sesuatu (misal: 'Bandung', 'Marc Klok', 'ACL')"
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: 15, outline: 'none' }}
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  if (val.trim().length > 1) {
                    const norm = val.toLowerCase();
                    // Filter match
                    const fMatches = matches.filter(m => m.homeClubName.toLowerCase().includes(norm) || m.awayClubName.toLowerCase().includes(norm) || (m.competition && m.competition.toLowerCase().includes(norm)));
                    setSearchResults({ matches: fMatches, players: [], clubs: [] });
                  } else {
                    setSearchResults({ matches: [], players: [], clubs: [] });
                  }
                }}
              />
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer' }} onClick={() => setGlobalSearchOpen(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="flex flex-col gap-16">
              {searchTerm.trim().length <= 1 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--neutral-500)', fontSize: 13 }}>
                  Ketik minimal 2 karakter untuk mencari...
                </div>
              ) : searchResults.matches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--neutral-500)', fontSize: 13 }}>
                  Tidak ada hasil yang ditemukan untuk "{searchTerm}"
                </div>
              ) : (
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--neutral-400)', marginBottom: 8 }}>Pertandingan ({searchResults.matches.length})</h4>
                  <div className="flex flex-col gap-8">
                    {searchResults.matches.map(m => (
                      <div
                        key={m.id}
                        style={{ padding: 12, backgroundColor: 'var(--navy-900)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => {
                          setGlobalSearchOpen(false);
                          router.push(`/schedule?edit=${m.id}`);
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{m.homeClubName} vs {m.awayClubName}</div>
                          <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{m.competition} • {m.kickoff}</div>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: 10 }}>Lihat</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--navy-800)', display: 'flex', gap: 16, fontSize: 10, color: 'var(--neutral-500)' }}>
              <span>ESC untuk keluar</span>
              <span>↑↓ navigasi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
