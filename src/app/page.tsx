'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  X,
  ChevronRight,
  Info,
  Shield,
  ArrowRight,
  Upload,
  History,
  User,
  Settings,
  LogOut,
  Trophy,
  Menu,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Radio,
  Pause,
  HelpCircle,
  Activity,
  Check,
  ExternalLink,
  Lock
} from 'lucide-react';
import {
  Club,
  Player,
  Match,
  Rumor,
  AuditLog,
  INITIAL_CLUBS,
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_RUMORS,
  INITIAL_AUDIT_LOGS
} from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';

// User Role Definition
type UserRole = 'Super Admin' | 'Admin Data' | 'Match Editor' | 'Rumor Editor' | 'Reviewer';

export default function Home() {
  // Navigation & Shell States
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'lineups' | 'results' | 'rumors' | 'clubs' | 'players' | 'logs' | 'settings'>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Super Admin');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{ show: boolean; action: () => void; title: string; message: string; dataSummary?: React.ReactNode } | null>(null);
  const [showAuditDrawer, setShowAuditDrawer] = useState<{ show: boolean; module: string; itemId: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Application Page States Toggles (for demo purposes in Settings/Status bar)
  const [uiState, setUiState] = useState<'default' | 'loading' | 'empty' | 'error'>('default');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Mock Database State
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [rumors, setRumors] = useState<Rumor[]>(INITIAL_RUMORS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Editor states
  const [editingLineupId, setEditingLineupId] = useState<string | null>(null);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingRumorId, setEditingRumorId] = useState<string | null>(null);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Filter States
  const [filterCompetition, setFilterCompetition] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterSearch, setFilterSearch] = useState('');

  // Toast handler
  const triggerToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
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
  }, []);

  // Load data from Supabase on mount
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        setUiState('loading');
        
        // 1. Fetch Clubs
        const { data: clubsData, error: clubsError } = await supabase.from('clubs').select('*');
        if (clubsError) throw clubsError;
        
        // 2. Fetch Players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
            id,
            full_name,
            display_name,
            country_code,
            country_flag_url,
            club_rosters (
              shirt_number,
              position,
              club_seasons (
                club_id,
                clubs (
                  name
                )
              )
            )
          `);
        if (playersError) throw playersError;

        // Map Clubs
        if (clubsData && clubsData.length > 0) {
          const mappedClubs: Club[] = clubsData.map(c => ({
            id: c.id,
            name: c.name,
            shortName: c.short_name || c.name,
            code: c.slug ? c.slug.slice(0, 3).toUpperCase() : 'CLUB',
            city: c.city || 'Unknown',
            stadium: 'Stadion Utama',
            founded: 1945,
            primaryColor: c.primary_color || '#1B365D',
            secondaryColor: c.secondary_color || '#E2E8F0',
            logoUrl: c.logo_public_url || '⚽',
            coach: 'Coach',
            activePlayersCount: 0,
            completeness: 80,
            status: 'active'
          }));
          setClubs(mappedClubs);
        }

        // Map Players
        if (playersData && playersData.length > 0) {
          const mappedPlayers: Player[] = playersData.map(p => {
            const roster = p.club_rosters && (p.club_rosters as any)[0];
            const clubId = roster?.club_seasons?.club_id || '';
            const clubName = roster?.club_seasons?.clubs?.name || 'Free Agent';
            const pos = roster?.position || 'Unknown';
            let position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' = 'Midfielder';
            if (pos === 'GK' || pos.toLowerCase().includes('goalkeeper')) position = 'Goalkeeper';
            else if (pos === 'DF' || pos.toLowerCase().includes('defender') || pos.toLowerCase().includes('back')) position = 'Defender';
            else if (pos === 'MF' || pos.toLowerCase().includes('midfielder') || pos.toLowerCase().includes('mid')) position = 'Midfielder';
            else if (pos === 'FW' || pos.toLowerCase().includes('forward') || pos.toLowerCase().includes('striker')) position = 'Forward';

            return {
              id: p.id,
              fullName: p.full_name,
              displayName: p.display_name || p.full_name,
              clubId,
              clubName,
              position,
              shirtNumber: roster?.shirt_number || 99,
              nationality: p.country_code === 'ID' ? 'Indonesia' : 'Asing',
              flagUrl: p.country_flag_url || '🇮🇩',
              age: 25,
              contractStart: '2025-01-01',
              contractEnd: '2028-01-01',
              status: 'active',
              availability: 'available',
              completeness: 85
            };
          });
          setPlayers(mappedPlayers);
        }

        setUiState('default');
        triggerToast('Berhasil memuat data dari Supabase!', 'success');
      } catch (error) {
        console.error('Gagal memuat data dari Supabase:', error);
        triggerToast('Gagal memuat data Supabase. Menggunakan data lokal.', 'warning');
        setUiState('default');
      }
    }

    loadSupabaseData();
  }, []);

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

  // Check Role Permissions helper
  const hasPermission = (module: string, action: 'read' | 'create_edit' | 'publish' | 'delete' | 'all') => {
    if (currentUserRole === 'Super Admin') return true;

    if (module === 'Master') {
      if (currentUserRole === 'Admin Data') return action !== 'delete';
      return action === 'read';
    }
    if (module === 'Lineup' || module === 'Match Result') {
      if (currentUserRole === 'Match Editor') return action !== 'delete' && action !== 'publish';
      if (currentUserRole === 'Reviewer') return true;
      return action === 'read';
    }
    if (module === 'Rumor') {
      if (currentUserRole === 'Rumor Editor') return action !== 'delete' && action !== 'publish';
      if (currentUserRole === 'Reviewer') return true;
      return action === 'read';
    }
    if (module === 'Settings' || module === 'User Role') {
      return false; // Only Super Admin
    }
    return false;
  };

  // Add Action Log helper
  const logAction = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
      user: currentUserRole,
      action,
      module,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
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

      {/* 1. Sidebar */}
      <aside className="sidebar" style={{ width: sidebarCollapsed ? '72px' : '248px' }}>
        <div className="sidebar-logo">
          {!sidebarCollapsed ? (
            <>
              <span style={{ color: 'var(--primary-600)' }}>🇮🇩</span>
              <span>GARUDA MATCH</span>
            </>
          ) : (
            <span style={{ color: 'var(--primary-600)' }}>🇮🇩</span>
          )}
        </div>

        <nav className="sidebar-menu">
          {!sidebarCollapsed && <div className="menu-category">Menu Utama</div>}
          <div className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveMenu('dashboard'); setEditingLineupId(null); setEditingResultId(null); setEditingRumorId(null); setEditingClubId(null); setEditingPlayerId(null); }}>
            <Activity size={18} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>

          {!sidebarCollapsed && <div className="menu-category">Pertandingan</div>}
          <div className={`menu-item ${activeMenu === 'lineups' ? 'active' : ''}`} onClick={() => { setActiveMenu('lineups'); setEditingLineupId(null); setEditingResultId(null); }}>
            <FileText size={18} />
            {!sidebarCollapsed && <span>Lineup Tim</span>}
          </div>
          <div className={`menu-item ${activeMenu === 'results' ? 'active' : ''}`} onClick={() => { setActiveMenu('results'); setEditingResultId(null); setEditingLineupId(null); }}>
            <Trophy size={18} />
            {!sidebarCollapsed && <span>Hasil Pertandingan</span>}
          </div>

          {!sidebarCollapsed && <div className="menu-category">Editorial</div>}
          <div className={`menu-item ${activeMenu === 'rumors' ? 'active' : ''}`} onClick={() => { setActiveMenu('rumors'); setEditingRumorId(null); }}>
            <Radio size={18} />
            {!sidebarCollapsed && <span>Rumor & Transfer</span>}
          </div>

          {!sidebarCollapsed && <div className="menu-category">Master Data</div>}
          <div className={`menu-item ${activeMenu === 'clubs' ? 'active' : ''}`} onClick={() => { setActiveMenu('clubs'); setEditingClubId(null); }}>
            <Shield size={18} />
            {!sidebarCollapsed && <span>Master Klub</span>}
          </div>
          <div className={`menu-item ${activeMenu === 'players' ? 'active' : ''}`} onClick={() => { setActiveMenu('players'); setEditingPlayerId(null); }}>
            <User size={18} />
            {!sidebarCollapsed && <span>Master Pemain</span>}
          </div>

          {!sidebarCollapsed && <div className="menu-category">Sistem</div>}
          <div className={`menu-item ${activeMenu === 'logs' ? 'active' : ''}`} onClick={() => setActiveMenu('logs')}>
            <History size={18} />
            {!sidebarCollapsed && <span>Audit Log</span>}
          </div>
          <div className={`menu-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenu('settings')}>
            <Settings size={18} />
            {!sidebarCollapsed && <span>Pengaturan Demo</span>}
          </div>
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed ? (
            <div className="flex align-center gap-12 w-full justify-between">
              <div className="flex align-center gap-8">
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: 13 }}>
                  {currentUserRole[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>Admin Garuda</div>
                  <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>{currentUserRole}</div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer' }} title="Log out / Ganti User" onClick={() => setActiveMenu('settings')}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', margin: '0 auto' }}>
              {currentUserRole[0]}
            </div>
          )}
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* 2. Top Header */}
        <header className="top-header">
          <div className="flex align-center gap-16">
            <button className="btn btn-sm btn-secondary" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title="Toggle Sidebar">
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
            {/* Quick Actions Dropdown */}
            {hasPermission('Lineup', 'create_edit') && (
              <div style={{ position: 'relative' }}>
                <button className="btn btn-sm btn-primary" onClick={() => {
                  if (activeMenu === 'lineups') setEditingLineupId('new');
                  else if (activeMenu === 'results') setEditingResultId('new');
                  else if (activeMenu === 'rumors') setEditingRumorId('new');
                  else if (activeMenu === 'clubs') setEditingClubId('new');
                  else if (activeMenu === 'players') setEditingPlayerId('new');
                  else {
                    setActiveMenu('lineups');
                    setEditingLineupId('new');
                  }
                }}>
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

        {/* State Toggle Buttons for UI states */}
        <div style={{ backgroundColor: 'var(--neutral-100)', padding: '6px 32px', borderBottom: '1px solid var(--neutral-200)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-700)' }}>Simulasi State Halaman:</span>
          <button className={`btn btn-sm ${uiState === 'default' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUiState('default')}>Default</button>
          <button className={`btn btn-sm ${uiState === 'loading' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUiState('loading')}>Loading/Skeleton</button>
          <button className={`btn btn-sm ${uiState === 'empty' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUiState('empty')}>Empty State</button>
          <button className={`btn btn-sm ${uiState === 'error' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUiState('error')}>Server Error</button>
          <div style={{ width: 1, height: 20, backgroundColor: 'var(--neutral-300)' }}></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={isOffline} onChange={(e) => setIsOffline(e.target.checked)} />
            Offline Mode
          </label>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'success' ? 'var(--success-600)' : toast.type === 'error' ? 'var(--danger-600)' : 'var(--warning-600)', color: 'white', padding: '12px 24px', borderRadius: 'var(--radius-md)', zIndex: 2000, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* 3. Page Container & Routing Router */}
        <main className="page-container">
          {uiState === 'loading' ? (
            <SkeletonLoading />
          ) : uiState === 'error' ? (
            <ErrorState onRetry={() => setUiState('default')} />
          ) : (
            <>
              {/* Dashboard Route */}
              {activeMenu === 'dashboard' && (
                <DashboardView
                  matches={matches}
                  rumors={rumors}
                  clubs={clubs}
                  players={players}
                  auditLogs={auditLogs}
                  onNavigate={setActiveMenu}
                  uiState={uiState}
                  hasPermission={hasPermission}
                  onEditLineup={(id) => { setEditingLineupId(id); setActiveMenu('lineups'); }}
                  onEditResult={(id) => { setEditingResultId(id); setActiveMenu('results'); }}
                />
              )}

              {/* Lineup Roster Route */}
              {activeMenu === 'lineups' && (
                editingLineupId ? (
                  <LineupEditorView
                    matchId={editingLineupId}
                    clubs={clubs}
                    players={players}
                    matches={matches}
                    onClose={() => setEditingLineupId(null)}
                    onSave={(updatedMatch) => {
                      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
                      logAction('UPDATE_LINEUP', 'Lineup Pertandingan', `Memperbarui formasi/lineup ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
                      triggerToast('Lineup berhasil disimpan!');
                      setEditingLineupId(null);
                    }}
                    triggerToast={triggerToast}
                    logAction={logAction}
                  />
                ) : (
                  <LineupsListView
                    matches={matches}
                    uiState={uiState}
                    onCreateNew={() => setEditingLineupId('new')}
                    onEdit={setEditingLineupId}
                    hasPermission={hasPermission}
                  />
                )
              )}

              {/* Match Result Route */}
              {activeMenu === 'results' && (
                editingResultId ? (
                  <MatchResultEditorView
                    matchId={editingResultId}
                    clubs={clubs}
                    players={players}
                    matches={matches}
                    onClose={() => setEditingResultId(null)}
                    onSave={(updatedMatch) => {
                      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
                      logAction('UPDATE_MATCH_RESULT', 'Match Result', `Memperbarui hasil skor ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
                      triggerToast('Hasil pertandingan berhasil diperbarui!');
                      setEditingResultId(null);
                    }}
                    triggerToast={triggerToast}
                    logAction={logAction}
                  />
                ) : (
                  <MatchResultsListView
                    matches={matches}
                    uiState={uiState}
                    onCreateNew={() => setEditingResultId('new')}
                    onEdit={setEditingResultId}
                    hasPermission={hasPermission}
                  />
                )
              )}

              {/* Rumor & Transfer Route */}
              {activeMenu === 'rumors' && (
                editingRumorId ? (
                  <RumorEditorView
                    rumorId={editingRumorId}
                    clubs={clubs}
                    players={players}
                    rumors={rumors}
                    onClose={() => setEditingRumorId(null)}
                    onSave={(updatedRumor) => {
                      if (editingRumorId === 'new') {
                        setRumors(prev => [updatedRumor, ...prev]);
                        logAction('CREATE_RUMOR', 'Rumor & Transfer', `Membuat rumor baru: ${updatedRumor.headline}`);
                        triggerToast('Rumor baru berhasil ditambahkan!');
                      } else {
                        setRumors(prev => prev.map(r => r.id === updatedRumor.id ? updatedRumor : r));
                        logAction('UPDATE_RUMOR', 'Rumor & Transfer', `Memperbarui rumor: ${updatedRumor.headline}`);
                        triggerToast('Rumor berhasil diperbarui!');
                      }
                      setEditingRumorId(null);
                    }}
                    triggerToast={triggerToast}
                  />
                ) : (
                  <RumorsListView
                    rumors={rumors}
                    uiState={uiState}
                    onCreateNew={() => setEditingRumorId('new')}
                    onEdit={setEditingRumorId}
                    hasPermission={hasPermission}
                  />
                )
              )}

              {/* Master Club Route */}
              {activeMenu === 'clubs' && (
                editingClubId ? (
                  <ClubEditorView
                    clubId={editingClubId}
                    clubs={clubs}
                    players={players}
                    onClose={() => setEditingClubId(null)}
                    onSave={(updatedClub) => {
                      if (editingClubId === 'new') {
                        setClubs(prev => [...prev, updatedClub]);
                        logAction('CREATE_CLUB', 'Master Klub', `Menambah master klub baru: ${updatedClub.name}`);
                        triggerToast('Klub baru berhasil ditambahkan!');
                      } else {
                        setClubs(prev => prev.map(c => c.id === updatedClub.id ? updatedClub : c));
                        logAction('UPDATE_CLUB', 'Master Klub', `Memperbarui profil klub: ${updatedClub.name}`);
                        triggerToast('Profil klub berhasil diperbarui!');
                      }
                      setEditingClubId(null);
                    }}
                  />
                ) : (
                  <ClubsListView
                    clubs={clubs}
                    uiState={uiState}
                    onCreateNew={() => setEditingClubId('new')}
                    onEdit={setEditingClubId}
                    hasPermission={hasPermission}
                  />
                )
              )}

              {/* Master Pemain Route */}
              {activeMenu === 'players' && (
                editingPlayerId ? (
                  <PlayerEditorView
                    playerId={editingPlayerId}
                    clubs={clubs}
                    players={players}
                    onClose={() => setEditingPlayerId(null)}
                    onSave={(updatedPlayer) => {
                      if (editingPlayerId === 'new') {
                        setPlayers(prev => [...prev, updatedPlayer]);
                        logAction('CREATE_PLAYER', 'Master Pemain', `Menambah master pemain baru: ${updatedPlayer.fullName}`);
                        triggerToast('Pemain baru berhasil ditambahkan!');
                      } else {
                        setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
                        logAction('UPDATE_PLAYER', 'Master Pemain', `Memperbarui profil pemain: ${updatedPlayer.fullName}`);
                        triggerToast('Profil pemain berhasil diperbarui!');
                      }
                      setEditingPlayerId(null);
                    }}
                  />
                ) : (
                  <PlayersListView
                    players={players}
                    clubs={clubs}
                    uiState={uiState}
                    onCreateNew={() => setEditingPlayerId('new')}
                    onEdit={setEditingPlayerId}
                    hasPermission={hasPermission}
                  />
                )
              )}

              {/* Audit Log Route */}
              {activeMenu === 'logs' && (
                <AuditLogsView auditLogs={auditLogs} />
              )}

              {/* Settings Route */}
              {activeMenu === 'settings' && (
                <SettingsView
                  currentUserRole={currentUserRole}
                  setCurrentUserRole={setCurrentUserRole}
                  uiState={uiState}
                  setUiState={setUiState}
                  hasUnsavedChanges={hasUnsavedChanges}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  isOffline={isOffline}
                  setIsOffline={setIsOffline}
                  triggerToast={triggerToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Search Overlay Modal */}
      {globalSearchOpen && (
        <GlobalSearchView
          clubs={clubs}
          players={players}
          rumors={rumors}
          matches={matches}
          onClose={() => setGlobalSearchOpen(false)}
          onNavigate={(menu, id) => {
            setActiveMenu(menu);
            if (menu === 'lineups') setEditingLineupId(id);
            if (menu === 'results') setEditingResultId(id);
            if (menu === 'rumors') setEditingRumorId(id);
            if (menu === 'clubs') setEditingClubId(id);
            if (menu === 'players') setEditingPlayerId(id);
            setGlobalSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// CUSTOM ICONS / HELPERS
// ==========================================
const DatabaseIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
    <path d="M3 12A9 3 0 0 0 21 12"></path>
  </svg>
);

// ==========================================
// STATE COMPONENTS: SKELETON / ERROR / EMPTY
// ==========================================
function SkeletonLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ height: 40, width: 300, backgroundColor: 'var(--neutral-200)', borderRadius: 4 }}></div>
      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 4', height: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 16, width: '40%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 32, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
        <div className="card" style={{ gridColumn: 'span 4', height: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 16, width: '40%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 32, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
        <div className="card" style={{ gridColumn: 'span 4', height: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 16, width: '40%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 32, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
      </div>
      <div className="table-wrapper" style={{ height: 300, backgroundColor: 'var(--neutral-100)' }}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 20, width: '100%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 20, width: '90%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 20, width: '95%', backgroundColor: 'var(--neutral-200)' }}></div>
          <div style={{ height: 20, width: '80%', backgroundColor: 'var(--neutral-200)' }}></div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: 24 }}>
      <AlertTriangle size={48} color="var(--danger-600)" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Gagal Memuat Data</h2>
      <p style={{ color: 'var(--neutral-700)', maxWidth: 400, marginBottom: 24 }}>
        Terjadi masalah koneksi ke server atau database Supabase. Silakan periksa jaringan Anda atau coba lagi beberapa saat.
      </p>
      <button className="btn btn-md btn-primary" onClick={onRetry}>
        Coba Lagi
      </button>
    </div>
  );
}

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
interface DashboardProps {
  matches: Match[];
  rumors: Rumor[];
  clubs: Club[];
  players: Player[];
  auditLogs: AuditLog[];
  onNavigate: (menu: any) => void;
  uiState: string;
  hasPermission: (module: string, action: any) => boolean;
  onEditLineup: (id: string) => void;
  onEditResult: (id: string) => void;
}

function DashboardView({ matches, rumors, clubs, players, auditLogs, onNavigate, onEditLineup, onEditResult }: DashboardProps) {
  // KPI Calculations
  const totalMatchesToday = matches.filter(m => m.status === 'Live' || m.status === 'Scheduled').length;
  const incompleteLineups = matches.filter(m => m.lineupStatus !== 'Complete').length;
  const resultsPendingReview = matches.filter(m => m.status === 'Live' || m.lineupStatus === 'Needs Review').length;
  const draftRumors = rumors.filter(r => r.publicationStatus === 'Draft').length;

  // Data quality warning count
  const dataQualityWarnings = [
    players.filter(p => !p.flagUrl).length > 0 && "Ada pemain tanpa info negara",
    clubs.filter(c => !c.logoUrl).length > 0 && "Klub tanpa logo",
    players.filter(p => p.completeness < 80).length > 0 && "Ada data pemain dengan kelengkapan < 80%"
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page Title */}
      <div>
        <h1 className="page-title">Garuda Matchroom</h1>
        <p className="page-description">Ringkasan operasional media olahraga hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Row 1 — KPI Cards */}
      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Pertandingan Hari Ini</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{totalMatchesToday}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => onNavigate('lineups')}>
            Lihat Agenda <ChevronRight size={12} />
          </button>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Lineup Belum Lengkap</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, color: incompleteLineups > 0 ? 'var(--warning-600)' : 'inherit' }}>{incompleteLineups}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => onNavigate('lineups')}>
            Lengkapi Sekarang <ChevronRight size={12} />
          </button>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Hasil Perlu Review</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, color: resultsPendingReview > 0 ? 'var(--warning-600)' : 'inherit' }}>{resultsPendingReview}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => onNavigate('results')}>
            Review Hasil <ChevronRight size={12} />
          </button>
        </div>

        <div className="card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Rumor Draft</span>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{draftRumors}</div>
          </div>
          <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => onNavigate('rumors')}>
            Lanjutkan Draft <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Row 2 — Agenda & Editor task panel */}
      <div className="grid-12">
        {/* Agenda Pertandingan */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Jadwal Pertandingan Terdekat</h3>
            <span className="badge badge-info">Liga Nusantara Utama 2026/27</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Kickoff / Venue</th>
                  <th>Lineup</th>
                  <th>Publikasi</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(match => (
                  <tr key={match.id}>
                    <td>
                      <div className="flex align-center gap-12">
                        <span style={{ fontSize: 20 }}>{match.homeLogo}</span>
                        <span className="semibold" style={{ fontSize: 13 }}>{match.homeClubName}</span>
                        <span className="text-muted">vs</span>
                        <span style={{ fontSize: 20 }}>{match.awayLogo}</span>
                        <span className="semibold" style={{ fontSize: 13 }}>{match.awayClubName}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{new Date(match.kickoff).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{match.venue}</div>
                    </td>
                    <td>
                      <span className={`badge ${match.lineupStatus === 'Complete' ? 'badge-success' : match.lineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft'}`}>
                        {match.lineupStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                        {match.publicationStatus}
                      </span>
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button className="btn btn-sm btn-secondary" title="Kelola Lineup" onClick={() => onEditLineup(match.id)}>
                          Lineup
                        </button>
                        <button className="btn btn-sm btn-primary" title="Input Hasil" onClick={() => onEditResult(match.id)}>
                          Hasil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editorial Tasks */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Tugas Editorial Saya</h3>
          <div className="flex flex-col gap-12" style={{ flex: 1 }}>
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: 3 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Tinjau rumor Transfer Ardi Pratama</div>
                <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2 }}>Minta konfirmasi agen pemain atau ofisial Cakra FC.</div>
                <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 6px', marginTop: 6 }}>Tier B · Penting</span>
              </div>
            </div>

            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: 3 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Update lineup Jakarta Garuda FC</div>
                <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2 }}>Kickoff besok 19.30. Starting lineup harus terisi min 11 pemain.</div>
                <span className="badge badge-danger" style={{ fontSize: 10, padding: '2px 6px', marginTop: 6 }}>Hari Ini</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Quality Warnings & Audit Trail */}
      <div className="grid-12">
        {/* Data Quality */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Peringatan Kualitas Data</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dataQualityWarnings.length > 0 ? (
              dataQualityWarnings.map((warn, index) => (
                <div key={index} style={{ padding: 12, backgroundColor: '#FEF3C7', borderLeft: '4px solid var(--warning-600)', borderRadius: 4, fontSize: 12, color: '#92400E', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} /> {warn}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--neutral-500)', fontSize: 13 }}>
                <CheckCircle size={24} color="var(--success-600)" style={{ margin: '0 auto 8px', display: 'block' }} />
                Semua data tersimpan bersih dan lengkap.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Aktivitas Sistem Terkini</h3>
            <button style={{ border: 'none', background: 'none', color: 'var(--primary-600)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }} onClick={() => onNavigate('logs')}>
              Semua Log
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {auditLogs.slice(0, 3).map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid var(--neutral-100)', paddingBottom: 10, fontSize: 12 }}>
                <div className="flex justify-between align-center" style={{ marginBottom: 4 }}>
                  <span className="semibold" style={{ color: 'var(--neutral-700)' }}>{log.user}</span>
                  <span className="text-muted" style={{ fontSize: 10 }}>{log.timestamp}</span>
                </div>
                <div style={{ color: 'var(--neutral-900)' }}>
                  <span className="badge badge-info" style={{ fontSize: 9, padding: '2px 6px', marginRight: 6 }}>{log.module}</span>
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. LINEUP LIST VIEW
// ==========================================
interface LineupsListProps {
  matches: Match[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function LineupsListView({ matches, onCreateNew, onEdit, hasPermission }: LineupsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComp, setSelectedComp] = useState('Semua');

  const filteredMatches = matches.filter(match => {
    const matchName = `${match.homeClubName} vs ${match.awayClubName}`.toLowerCase();
    const matchesSearch = matchName.includes(searchTerm.toLowerCase()) || match.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComp = selectedComp === 'Semua' || match.competition.includes(selectedComp);
    return matchesSearch && matchesComp;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Lineup Pertandingan</span>
          </div>
          <h1 className="page-title">Lineup Pertandingan</h1>
          <p className="page-description">Kelola susunan pemain, formasi awal, dan pemain cadangan match Liga Nusantara Utama.</p>
        </div>
        {hasPermission('Lineup', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Buat Lineup
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
          <div className="search-input-wrapper" style={{ maxWidth: 300 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari klub atau stadion..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ maxWidth: 200 }} value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
            <option value="Semua">Semua Kompetisi</option>
            <option value="Liga Nusantara">Liga Nusantara Utama</option>
          </select>
        </div>

        {searchTerm || selectedComp !== 'Semua' ? (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setSelectedComp('Semua'); }}>
            Reset Filter
          </button>
        ) : null}
      </div>

      {/* Data Table */}
      {filteredMatches.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Belum ada lineup pada periode ini</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Buat lineup baru atau ubah kata kunci filter yang digunakan.</p>
          <button className="btn btn-sm btn-primary" onClick={onCreateNew}>Buat Lineup</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertandingan</th>
                <th>Kompetisi</th>
                <th>Kickoff</th>
                <th>Status Data</th>
                <th>Publikasi</th>
                <th>Editor</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(match => (
                <tr key={match.id}>
                  <td>
                    <div className="flex align-center gap-12">
                      <span style={{ fontSize: 22 }}>{match.homeLogo}</span>
                      <div>
                        <div className="semibold">{match.homeClubName} vs {match.awayClubName} {match.awayLogo}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>Venue: {match.venue}</div>
                      </div>
                    </div>
                  </td>
                  <td>{match.competition}</td>
                  <td>{new Date(match.kickoff).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB</td>
                  <td>
                    <span className={`badge ${match.lineupStatus === 'Complete' ? 'badge-success' : match.lineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft'}`}>
                      {match.lineupStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                      {match.publicationStatus}
                    </span>
                  </td>
                  <td>{match.editor}</td>
                  <td className="text-right">
                    <button className="btn btn-sm btn-secondary" onClick={() => onEdit(match.id)}>
                      Edit Lineup
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

// ==========================================
// 3. LINEUP EDITOR VIEW (DEEP IMPLEMENTATION)
// ==========================================
interface LineupEditorProps {
  matchId: string;
  clubs: Club[];
  players: Player[];
  matches: Match[];
  onClose: () => void;
  onSave: (match: Match) => void;
  triggerToast: (msg: string, type?: any) => void;
  logAction: (action: string, module: string, details: string) => void;
}

function LineupEditorView({ matchId, clubs, players, matches, onClose, onSave, triggerToast }: LineupEditorProps) {
  const isNew = matchId === 'new';
  const match = matches.find(m => m.id === matchId) || {
    id: `match-${Date.now()}`,
    homeClubId: clubs[0]?.id || '',
    homeClubName: clubs[0]?.name || '',
    homeLogo: clubs[0]?.logoUrl || '',
    awayClubId: clubs[1]?.id || '',
    awayClubName: clubs[1]?.name || '',
    awayLogo: clubs[1]?.logoUrl || '',
    competition: 'Liga Nusantara Utama 2026/27',
    season: '2026/27',
    kickoff: new Date().toISOString(),
    venue: clubs[0]?.stadium || '',
    status: 'Scheduled' as const,
    lineupStatus: 'Draft' as const,
    publicationStatus: 'Draft' as const,
    editor: 'Match Editor A',
    lastUpdated: 'Baru saja'
  };

  // State fields
  const [selectedHomeClub, setSelectedHomeClub] = useState(match.homeClubId);
  const [selectedAwayClub, setSelectedAwayClub] = useState(match.awayClubId);
  const [homeFormation, setHomeFormation] = useState('4-3-3');
  const [awayFormation, setAwayFormation] = useState('4-2-3-1');
  const [kickoffTime, setKickoffTime] = useState(match.kickoff);
  const [venueName, setVenueName] = useState(match.venue);

  // Home & Away DSP starters and subs list (Simulated via indices)
  const homeSquad = players.filter(p => p.clubId === selectedHomeClub);
  const awaySquad = players.filter(p => p.clubId === selectedAwayClub);

  const [homeStarters, setHomeStarters] = useState<string[]>(homeSquad.slice(0, 11).map(p => p.id));
  const [homeSubs, setHomeSubs] = useState<string[]>(homeSquad.slice(11, 18).map(p => p.id));
  const [awayStarters, setAwayStarters] = useState<string[]>(awaySquad.slice(0, 11).map(p => p.id));
  const [awaySubs, setAwaySubs] = useState<string[]>(awaySquad.slice(11, 18).map(p => p.id));

  // Captain & GK Selectors
  const [homeCaptain, setHomeCaptain] = useState<string>(homeSquad[0]?.id || '');
  const [awayCaptain, setAwayCaptain] = useState<string>(awaySquad[0]?.id || '');

  // Validation warnings states
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  // Dynamic preview tab state
  const [activeTab, setActiveTab] = useState<'lineup' | 'info' | 'preview'>('lineup');

  // Trigger Validation check
  const runValidation = () => {
    const errors: string[] = [];

    // Check Home Roster
    if (homeStarters.length !== 11) {
      errors.push(`Starting XI Home harus berisi tepat 11 pemain (saat ini ${homeStarters.length})`);
    }
    const homeGK = homeSquad.filter(p => homeStarters.includes(p.id) && p.position === 'Goalkeeper');
    if (homeGK.length === 0) {
      errors.push('Tim Home membutuhkan minimal 1 penjaga gawang (Goalkeeper) di Starting XI.');
    }
    if (!homeStarters.includes(homeCaptain)) {
      errors.push('Kapten Tim Home harus terpilih dari salah satu pemain starter.');
    }

    // Check Away Roster
    if (awayStarters.length !== 11) {
      errors.push(`Starting XI Away harus berisi tepat 11 pemain (saat ini ${awayStarters.length})`);
    }
    const awayGK = awaySquad.filter(p => awayStarters.includes(p.id) && p.position === 'Goalkeeper');
    if (awayGK.length === 0) {
      errors.push('Tim Away membutuhkan minimal 1 penjaga gawang (Goalkeeper) di Starting XI.');
    }
    if (!awayStarters.includes(awayCaptain)) {
      errors.push('Kapten Tim Away harus terpilih dari salah satu pemain starter.');
    }

    // Availability Check (Injured/Suspended players warning)
    const unavailableStarters = [...homeStarters, ...awayStarters]
      .map(id => players.find(p => p.id === id))
      .filter(p => p && (p.availability === 'injured' || p.availability === 'suspended'));

    if (unavailableStarters.length > 0) {
      const names = unavailableStarters.map(p => `${p?.displayName} (${p?.availability === 'injured' ? 'Cedera' : 'Hukuman'})`).join(', ');
      errors.push(`Peringatan Availability: Striker/Pemain ${names} berstatus tidak tersedia tetapi terpilih sebagai Starter.`);
      setShowOverrideInput(true);
    } else {
      setShowOverrideInput(false);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    runValidation();
  }, [homeStarters, awayStarters, homeCaptain, awayCaptain, selectedHomeClub, selectedAwayClub]);

  const handleSave = () => {
    if (validationErrors.length > 0 && showOverrideInput && !overrideReason) {
      triggerToast('Mohon isi alasan override pemain yang cedera/diskualifikasi.', 'error');
      return;
    }

    const homeClub = clubs.find(c => c.id === selectedHomeClub);
    const awayClub = clubs.find(c => c.id === selectedAwayClub);

    const updatedMatch: Match = {
      ...match,
      homeClubId: selectedHomeClub,
      homeClubName: homeClub?.name || '',
      homeLogo: homeClub?.logoUrl || '',
      awayClubId: selectedAwayClub,
      awayClubName: awayClub?.name || '',
      awayLogo: awayClub?.logoUrl || '',
      venue: venueName,
      kickoff: kickoffTime,
      lineupStatus: validationErrors.length === 0 ? 'Complete' : 'Needs Review',
      publicationStatus: match.publicationStatus === 'Published' ? 'Published' : 'Draft',
    };

    onSave(updatedMatch);
  };

  // Starters toggling simulation
  const toggleHomeStarter = (id: string) => {
    if (homeStarters.includes(id)) {
      setHomeStarters(prev => prev.filter(p => p !== id));
      setHomeSubs(prev => [...prev, id]);
    } else {
      setHomeStarters(prev => [...prev, id]);
      setHomeSubs(prev => prev.filter(p => p !== id));
    }
  };

  const toggleAwayStarter = (id: string) => {
    if (awayStarters.includes(id)) {
      setAwayStarters(prev => prev.filter(p => p !== id));
      setAwaySubs(prev => [...prev, id]);
    } else {
      setAwayStarters(prev => [...prev, id]);
      setAwaySubs(prev => prev.filter(p => p !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Editor Header */}
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {isNew ? 'Buat Lineup Baru' : `Edit Lineup: ${match.homeClubName} vs ${match.awayClubName}`}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
              Status Roster: {validationErrors.length === 0 ? <span style={{ color: 'var(--success-600)' }}>Terpenuhi</span> : <span style={{ color: 'var(--warning-600)' }}>Review Diperlukan</span>}
            </div>
          </div>
        </div>

        <div className="flex align-center gap-12">
          <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>Autosaved ke local draft</span>
          <button className="btn btn-md btn-secondary" onClick={handleSave}>Simpan Draft</button>
          <button className="btn btn-md btn-primary" onClick={handleSave} disabled={validationErrors.length > 0 && !overrideReason}>
            Submit / Terbitkan
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="tab-container">
        <div className={`tab-item ${activeTab === 'lineup' ? 'active' : ''}`} onClick={() => setActiveTab('lineup')}>Roster Pemain & Taktik</div>
        <div className={`tab-item ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Match Info & Venue</div>
        <div className={`tab-item ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>Editorial Preview Card</div>
      </div>

      {activeTab === 'lineup' && (
        <div className="grid-12">
          {/* Main workspace - Home & Away lists */}
          <div style={{ gridColumn: 'span 8', display: 'flex', gap: 24 }}>
            {/* Home Panel */}
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div className="flex justify-between align-center" style={{ marginBottom: 16, borderBottom: '1px solid var(--neutral-100)', paddingBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Home: {clubs.find(c => c.id === selectedHomeClub)?.name}</span>
                <select className="form-select" style={{ width: 100, padding: 4 }} value={homeFormation} onChange={(e) => setHomeFormation(e.target.value)}>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="3-5-2">3-5-2</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span className="semibold" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Starting XI (Pilih 11)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {homeSquad.map(player => (
                    <div key={player.id} className="flex align-center justify-between" style={{ padding: 8, border: '1px solid var(--neutral-200)', borderRadius: 6, backgroundColor: homeStarters.includes(player.id) ? 'var(--primary-50)' : 'transparent' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" checked={homeStarters.includes(player.id)} onChange={() => toggleHomeStarter(player.id)} />
                        <span>{player.flagUrl} #{player.shirtNumber} <b>{player.fullName}</b> ({player.position})</span>
                      </label>
                      <div className="flex gap-8 align-center">
                        {player.availability !== 'available' && <span className="badge badge-danger" style={{ padding: '1px 6px', fontSize: 9 }}>{player.availability}</span>}
                        {homeStarters.includes(player.id) && (
                          <button className={`btn btn-sm ${homeCaptain === player.id ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '2px 8px', height: 22, fontSize: 10 }} onClick={() => setHomeCaptain(player.id)}>
                            C
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Away Panel */}
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div className="flex justify-between align-center" style={{ marginBottom: 16, borderBottom: '1px solid var(--neutral-100)', paddingBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Away: {clubs.find(c => c.id === selectedAwayClub)?.name}</span>
                <select className="form-select" style={{ width: 100, padding: 4 }} value={awayFormation} onChange={(e) => setAwayFormation(e.target.value)}>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="3-5-2">3-5-2</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span className="semibold" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Starting XI (Pilih 11)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {awaySquad.map(player => (
                    <div key={player.id} className="flex align-center justify-between" style={{ padding: 8, border: '1px solid var(--neutral-200)', borderRadius: 6, backgroundColor: awayStarters.includes(player.id) ? 'var(--primary-50)' : 'transparent' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" checked={awayStarters.includes(player.id)} onChange={() => toggleAwayStarter(player.id)} />
                        <span>{player.flagUrl} #{player.shirtNumber} <b>{player.fullName}</b> ({player.position})</span>
                      </label>
                      <div className="flex gap-8 align-center">
                        {player.availability !== 'available' && <span className="badge badge-danger" style={{ padding: '1px 6px', fontSize: 9 }}>{player.availability}</span>}
                        {awayStarters.includes(player.id) && (
                          <button className={`btn btn-sm ${awayCaptain === player.id ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '2px 8px', height: 22, fontSize: 10 }} onClick={() => setAwayCaptain(player.id)}>
                            C
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Checklist / Override widget */}
          <div style={{ gridColumn: 'span 4' }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Verifikasi Aturan Lineup</h3>
              {validationErrors.length === 0 ? (
                <div style={{ color: 'var(--success-600)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <CheckCircle size={16} /> Semua aturan lineup terpenuhi. Data aman dipublikasikan.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {validationErrors.map((err, index) => (
                    <div key={index} style={{ color: 'var(--danger-600)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{err}</span>
                    </div>
                  ))}

                  {showOverrideInput && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--neutral-200)' }}>
                      <label className="form-label">Alasan Override Pemain Suspended/Injured <span className="required">*</span></label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Contoh: Pemain dinyatakan fit oleh tim medis pasca tes terakhir pagi ini."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tactical pitch view */}
            <div className="card" style={{ backgroundColor: 'var(--primary-700)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 280, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ border: '2px solid rgba(255,255,255,0.2)', width: '100%', height: 220, borderRadius: 8, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, opacity: 0.6 }}>MID</span>
                </div>
                <span style={{ fontSize: 11, backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: 4 }}>Pitch Visualizer</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 12, opacity: 0.8, textAlign: 'center' }}>
                Home Formasi: {homeFormation} vs Away Formasi: {awayFormation}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="form-group">
            <label className="form-label">Klub Home</label>
            <select className="form-select" value={selectedHomeClub} onChange={(e) => setSelectedHomeClub(e.target.value)}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Klub Away</label>
            <select className="form-select" value={selectedAwayClub} onChange={(e) => setSelectedAwayClub(e.target.value)}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Jadwal Kickoff</label>
            <input type="datetime-local" className="form-input" value={kickoffTime.slice(0, 16)} onChange={(e) => setKickoffTime(new Date(e.target.value).toISOString())} />
          </div>
          <div className="form-group">
            <label className="form-label">Stadion / Venue</label>
            <input type="text" className="form-input" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* Public Graphic Card Preview Mock */}
          <div style={{ width: 360, height: 640, backgroundColor: 'var(--navy-950)', borderRadius: 12, color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>Liga Nusantara Utama</div>
              <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>18 Juli 2026, 19.30 WIB</div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
              <div className="flex justify-between align-center">
                <div>
                  <div style={{ fontSize: 24 }}>🦅</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>JAKARTA GARUDA</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>Formasi: {homeFormation}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>VS</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24 }}>🦈</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>SURABAYA SAMUDRA</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>Formasi: {awayFormation}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>STARTERS:</div>
                  {homeSquad.slice(0, 5).map(p => <div key={p.id} style={{ opacity: 0.8 }}>#{p.shirtNumber} {p.displayName}</div>)}
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>STARTERS:</div>
                  {awaySquad.slice(0, 5).map(p => <div key={p.id} style={{ opacity: 0.8 }}>#{p.shirtNumber} {p.displayName}</div>)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.4, fontSize: 9 }}>
              <span>@GARUDAMATCHROOM</span>
              <span>HD OUTPUT (4X)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. MATCH RESULT LIST VIEW
// ==========================================
interface MatchResultsListProps {
  matches: Match[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function MatchResultsListView({ matches, onEdit, hasPermission }: MatchResultsListProps) {
  const [selectedComp, setSelectedComp] = useState('Semua');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Hasil Pertandingan</span>
          </div>
          <h1 className="page-title">Hasil Pertandingan</h1>
          <p className="page-description">Kelola skor akhir, timeline pencetak gol, status adu penalti, dan status review pertandingan.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <select className="form-select" style={{ maxWidth: 200 }} value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
          <option value="Semua">Semua Kompetisi</option>
          <option value="Liga Nusantara">Liga Nusantara Utama</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pertandingan</th>
              <th>Kompetisi</th>
              <th>Skor Akhir</th>
              <th>Status</th>
              <th>Review Status</th>
              <th>Publikasi</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <tr key={match.id}>
                <td>
                  <div className="flex align-center gap-12">
                    <span style={{ fontSize: 20 }}>{match.homeLogo}</span>
                    <span className="semibold">{match.homeClubName} vs {match.awayClubName} {match.awayLogo}</span>
                  </div>
                </td>
                <td>{match.competition}</td>
                <td>
                  {match.status === 'Scheduled' ? (
                    <span className="text-muted">-</span>
                  ) : (
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{match.homeScore} - {match.awayScore}</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${match.status === 'Finished' ? 'badge-success' : match.status === 'Live' ? 'badge-danger' : 'badge-warning'}`}>
                    {match.status}
                  </span>
                </td>
                <td>
                  <span className={`badge ${match.lineupStatus === 'Complete' ? 'badge-success' : 'badge-warning'}`}>
                    {match.lineupStatus}
                  </span>
                </td>
                <td>
                  <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                    {match.publicationStatus}
                  </span>
                </td>
                <td className="text-right">
                  <button className="btn btn-sm btn-secondary" onClick={() => onEdit(match.id)}>
                    Input Hasil / Skor
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 5. MATCH RESULT EDITOR VIEW (DEEP IMPLEMENTATION)
// ==========================================
interface MatchResultEditorProps {
  matchId: string;
  clubs: Club[];
  players: Player[];
  matches: Match[];
  onClose: () => void;
  onSave: (match: Match) => void;
  triggerToast: (msg: string, type?: any) => void;
  logAction: (action: string, module: string, details: string) => void;
}

interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  playerName: string;
  clubId: string;
}

function MatchResultEditorView({ matchId, clubs, players, matches, onClose, onSave, triggerToast, logAction }: MatchResultEditorProps) {
  const match = matches.find(m => m.id === matchId)!;

  // Editor states
  const [homeScore, setHomeScore] = useState(match.homeScore || 0);
  const [awayScore, setAwayScore] = useState(match.awayScore || 0);
  const [matchStatus, setMatchStatus] = useState<'Scheduled' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled'>(match.status);

  // Safety confirmation states
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [safetyReason, setSafetyReason] = useState('');

  // Timeline events mock data state
  const [events, setEvents] = useState<MatchEvent[]>([
    { id: '1', minute: 15, type: 'goal', playerName: 'Bruno Silva', clubId: match.awayClubId },
    { id: '2', minute: 40, type: 'yellow_card', playerName: 'Rizky Ridho', clubId: match.homeClubId },
    { id: '3', minute: 65, type: 'goal', playerName: 'Gustavo Almeida', clubId: match.homeClubId },
    { id: '4', minute: 82, type: 'goal', playerName: 'Witan Sulaeman', clubId: match.homeClubId }
  ]);

  // Form event handlers
  const [newEventMinute, setNewEventMinute] = useState(45);
  const [newEventType, setNewEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'substitution'>('goal');
  const [newEventPlayer, setNewEventPlayer] = useState('');
  const [newEventClub, setNewEventClub] = useState(match.homeClubId);

  const addEvent = () => {
    if (!newEventPlayer) {
      triggerToast('Pilih pemain terlebih dahulu.', 'error');
      return;
    }
    const evt: MatchEvent = {
      id: `${Date.now()}`,
      minute: newEventMinute,
      type: newEventType,
      playerName: newEventPlayer,
      clubId: newEventClub
    };
    setEvents(prev => [...prev, evt].sort((a, b) => a.minute - b.minute));
    triggerToast('Event berhasil ditambahkan ke timeline!');
  };

  const handleSaveWithSafetyCheck = () => {
    // If score changed and was already published
    const scoreChanged = homeScore !== match.homeScore || awayScore !== match.awayScore;
    const wasPublished = match.publicationStatus === 'Published';

    if (scoreChanged && wasPublished) {
      setShowReasonModal(true);
    } else {
      submitUpdate();
    }
  };

  const submitUpdate = () => {
    const updatedMatch: Match = {
      ...match,
      homeScore,
      awayScore,
      status: matchStatus,
      lineupStatus: safetyReason ? 'Needs Review' : 'Complete', // reset to review if modified with reason
    };
    if (safetyReason) {
      logAction('SAFETY_TRIGGERED', 'Match Result', `Perubahan skor oleh admin. Alasan: "${safetyReason}"`);
    }
    onSave(updatedMatch);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Editor Header */}
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Input Hasil & Timeline Pertandingan</h2>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>{match.competition} · {match.venue}</div>
          </div>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-md btn-primary" onClick={handleSaveWithSafetyCheck}>
            Simpan Hasil Akhir
          </button>
        </div>
      </div>

      <div className="grid-12">
        {/* Left Side: Scores and Safety check info */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Skor Akhir & Status</h3>

          <div className="flex align-center justify-between" style={{ padding: '24px 0', borderBottom: '1px solid var(--neutral-100)' }}>
            {/* Home score */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 36 }}>{match.homeLogo}</div>
              <div className="semibold" style={{ fontSize: 15, margin: '8px 0' }}>{match.homeClubName}</div>
              <input type="number" className="form-input" style={{ width: 80, fontSize: 24, textAlign: 'center' }} value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} />
            </div>

            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--neutral-300)' }}>VS</div>

            {/* Away score */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 36 }}>{match.awayLogo}</div>
              <div className="semibold" style={{ fontSize: 15, margin: '8px 0' }}>{match.awayClubName}</div>
              <input type="number" className="form-input" style={{ width: 80, fontSize: 24, textAlign: 'center' }} value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="form-label">Status Pertandingan</label>
            <select className="form-select" value={matchStatus} onChange={(e: any) => setMatchStatus(e.target.value)}>
              <option value="Scheduled">Scheduled</option>
              <option value="Live">Live (Dalam Pertandingan)</option>
              <option value="Finished">Finished (Selesai)</option>
              <option value="Postponed">Postponed (Ditunda)</option>
              <option value="Cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </div>
        </div>

        {/* Right Side: Timeline event input & list */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Timeline Gol / Kartu</h3>

          {/* Add Event Form */}
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
            <span className="semibold" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>Tambah Kejadian Pertandingan</span>

            <div className="grid-12" style={{ gap: 12 }}>
              <div style={{ gridColumn: 'span 4' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Menit</label>
                <input type="number" className="form-input" value={newEventMinute} onChange={(e) => setNewEventMinute(Number(e.target.value))} />
              </div>
              <div style={{ gridColumn: 'span 8' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Jenis Kejadian</label>
                <select className="form-select" value={newEventType} onChange={(e: any) => setNewEventType(e.target.value)}>
                  <option value="goal">Goal ⚽</option>
                  <option value="yellow_card">Kartu Kuning 🟨</option>
                  <option value="red_card">Kartu Merah 🟥</option>
                  <option value="substitution">Pergantian Pemain 🔄</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Klub Asal</label>
                <select className="form-select" value={newEventClub} onChange={(e) => setNewEventClub(e.target.value)}>
                  <option value={match.homeClubId}>{match.homeClubName}</option>
                  <option value={match.awayClubId}>{match.awayClubName}</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Nama Pemain</label>
                <input type="text" className="form-input" placeholder="Nama Pemain..." value={newEventPlayer} onChange={(e) => setNewEventPlayer(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-sm btn-primary w-full" style={{ marginTop: 12 }} onClick={addEvent}>
              Tambahkan Event
            </button>
          </div>

          {/* Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((evt) => (
              <div key={evt.id} className="flex justify-between align-center" style={{ padding: '8px 12px', backgroundColor: 'var(--neutral-50)', borderRadius: 6, fontSize: 13 }}>
                <div className="flex align-center gap-8">
                  <span className="semibold" style={{ color: 'var(--primary-600)' }}>{evt.minute}'</span>
                  <span>{evt.type === 'goal' ? '⚽' : evt.type === 'yellow_card' ? '🟨' : evt.type === 'red_card' ? '🟥' : '🔄'}</span>
                  <span>{evt.playerName}</span>
                </div>
                <span className="text-muted" style={{ fontSize: 11 }}>{evt.clubId === match.homeClubId ? 'Home' : 'Away'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Rules Reason Dialog Modal */}
      {showReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--danger-600)' }}>Konfirmasi Perubahan Skor Published</h3>
            <p style={{ fontSize: 13, color: 'var(--neutral-700)', marginBottom: 16 }}>
              Hasil pertandingan ini sebelumnya telah dipublikasikan. Mengubah skor akhir akan mencatat audit trail khusus dan mereset status data menjadi <b>Needs Review</b>.
            </p>
            <div className="form-group">
              <label className="form-label">Alasan Perubahan Skor <span className="required">*</span></label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Contoh: Kesalahan input skor oleh petugas lapangan iLeague."
                value={safetyReason}
                onChange={(e) => setSafetyReason(e.target.value)}
              />
            </div>
            <div className="flex gap-12 justify-between" style={{ marginTop: 16 }}>
              <button className="btn btn-md btn-secondary" onClick={() => setShowReasonModal(false)}>Batal</button>
              <button className="btn btn-md btn-danger" disabled={!safetyReason} onClick={() => {
                setShowReasonModal(false);
                submitUpdate();
              }}>
                Konfirmasi Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. RUMOR & TRANSFER VIEW
// ==========================================
interface RumorsListProps {
  rumors: Rumor[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function RumorsListView({ rumors, onCreateNew, onEdit, hasPermission }: RumorsListProps) {
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [selectedTier, setSelectedTier] = useState('Semua');

  const filteredRumors = rumors.filter(r => selectedTier === 'Semua' || r.reliabilityTier === selectedTier);

  // Kanban Columns
  const boardColumns = ['Draft', 'Review', 'Scheduled', 'Published'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Rumor & Transfer Pemain</span>
          </div>
          <h1 className="page-title">Rumor & Transfer</h1>
          <p className="page-description">Kelola berita transfer terbaru, tingkat validitas rumor (Tiers A-D), dan editorial timeline.</p>
        </div>
        {hasPermission('Rumor', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Tambah Rumor
          </button>
        )}
      </div>

      {/* Filter / View Toggler */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex gap-12">
          <select className="form-select" value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
            <option value="Semua">Semua Reliability Tier</option>
            <option value="A">Tier A (Sangat Terpercaya)</option>
            <option value="B">Tier B (Terpercaya)</option>
            <option value="C">Tier C (Berkembang)</option>
            <option value="D">Tier D (Spekulatif)</option>
          </select>
        </div>

        <div style={{ border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('board')}>Board View</button>
          <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setViewMode('table')}>Table View</button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {boardColumns.map(col => {
            const colRumors = filteredRumors.filter(r => r.publicationStatus === col);
            return (
              <div key={col} style={{ backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-lg)', padding: 12, minHeight: 400 }}>
                <div className="flex justify-between align-center" style={{ marginBottom: 12 }}>
                  <span className="semibold" style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--neutral-700)' }}>{col}</span>
                  <span className="badge badge-info" style={{ fontSize: 10, padding: '2px 6px' }}>{colRumors.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {colRumors.map(rumor => (
                    <div key={rumor.id} className="card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => onEdit(rumor.id)}>
                      <span className={`badge ${rumor.reliabilityTier === 'A' ? 'badge-success' : rumor.reliabilityTier === 'B' ? 'badge-info' : rumor.reliabilityTier === 'C' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 9, padding: '2px 6px', marginBottom: 8 }}>
                        Tier {rumor.reliabilityTier}
                      </span>
                      <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{rumor.headline}</h4>
                      <div className="flex justify-between align-center" style={{ fontSize: 10, color: 'var(--neutral-500)' }}>
                        <span>Peluang: {rumor.probability}%</span>
                        <span>{rumor.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Pemain</th>
                <th>Klub Asal</th>
                <th>Klub Tujuan</th>
                <th>Tier</th>
                <th>Publikasi</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRumors.map(rumor => (
                <tr key={rumor.id}>
                  <td><span className="semibold">{rumor.headline}</span></td>
                  <td>{rumor.player}</td>
                  <td>{rumor.fromClub}</td>
                  <td>{rumor.destinationClub}</td>
                  <td>
                    <span className={`badge ${rumor.reliabilityTier === 'A' ? 'badge-success' : rumor.reliabilityTier === 'B' ? 'badge-info' : rumor.reliabilityTier === 'C' ? 'badge-warning' : 'badge-danger'}`}>
                      Tier {rumor.reliabilityTier}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-draft">{rumor.publicationStatus}</span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-sm btn-secondary" onClick={() => onEdit(rumor.id)}>
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

// ==========================================
// 7. RUMOR EDITOR VIEW (DEEP IMPLEMENTATION)
// ==========================================
interface RumorEditorProps {
  rumorId: string;
  clubs: Club[];
  players: Player[];
  rumors: Rumor[];
  onClose: () => void;
  onSave: (rumor: Rumor) => void;
  triggerToast: (msg: string, type?: any) => void;
}

function RumorEditorView({ rumorId, clubs, rumors, onClose, onSave, triggerToast }: RumorEditorProps) {
  const isNew = rumorId === 'new';
  const rumor = rumors.find(r => r.id === rumorId) || {
    id: `rumor-${Date.now()}`,
    headline: '',
    player: '',
    fromClub: clubs[0]?.name || '',
    destinationClub: clubs[1]?.name || '',
    type: 'rumor' as const,
    reliabilityTier: 'C' as const,
    sourceName: '',
    sourceUrl: '',
    publicationStatus: 'Draft' as const,
    transferStatus: 'Rumor' as const,
    probability: 50,
    shortSummary: '',
    articleBody: '',
    author: 'Rumor Editor X'
  };

  // State fields
  const [headline, setHeadline] = useState(rumor.headline);
  const [playerName, setPlayerName] = useState(rumor.player);
  const [fromClub, setFromClub] = useState(rumor.fromClub);
  const [destClub, setDestClub] = useState(rumor.destinationClub);
  const [type, setType] = useState(rumor.type);
  const [tier, setTier] = useState(rumor.reliabilityTier);
  const [probability, setProbability] = useState(rumor.probability);
  const [sourceName, setSourceName] = useState(rumor.sourceName);
  const [sourceUrl, setSourceUrl] = useState(rumor.sourceUrl);
  const [summary, setSummary] = useState(rumor.shortSummary);
  const [body, setBody] = useState(rumor.articleBody);
  const [pubStatus, setPubStatus] = useState(rumor.publicationStatus);

  const handleSave = () => {
    if (!headline || !playerName || !sourceName) {
      triggerToast('Mohon lengkapi judul rumor, nama pemain, dan nama sumber.', 'error');
      return;
    }

    if (tier === 'D' && pubStatus === 'Published') {
      triggerToast('Peringatan: Berita rumor Tier D (Spekulatif) membutuhkan approval Reviewer.', 'warning');
    }

    const updatedRumor: Rumor = {
      ...rumor,
      headline,
      player: playerName,
      fromClub,
      destinationClub: destClub,
      type,
      reliabilityTier: tier,
      probability,
      sourceName,
      sourceUrl,
      publicationStatus: pubStatus,
      shortSummary: summary,
      articleBody: body
    };

    onSave(updatedRumor);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isNew ? 'Tambah Berita Rumor Baru' : 'Edit Artikel Rumor'}</h2>
        </div>

        <button className="btn btn-md btn-primary" onClick={handleSave}>
          Simpan Rumor
        </button>
      </div>

      <div className="grid-12">
        {/* Article content fields */}
        <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Headline / Judul Artikel <span className="required">*</span></label>
            <input type="text" className="form-input" placeholder="Contoh: Jakarta Garuda FC Memantau Penyerang..." value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Ringkasan Singkat</label>
            <textarea className="form-textarea" rows={2} placeholder="Teks preview artikel..." value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Isi Lengkap Berita</label>
            <textarea className="form-textarea" rows={6} placeholder="Isi artikel berita transfer..." value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>

        {/* Sidebar settings fields */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nama Pemain <span className="required">*</span></label>
            <input type="text" className="form-input" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Klub Asal</label>
            <input type="text" className="form-input" value={fromClub} onChange={(e) => setFromClub(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Klub Tujuan</label>
            <input type="text" className="form-input" value={destClub} onChange={(e) => setDestClub(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Reliability Tier</label>
            <select className="form-select" value={tier} onChange={(e: any) => setTier(e.target.value)}>
              <option value="A">Tier A (Sangat Terpercaya)</option>
              <option value="B">Tier B (Terpercaya)</option>
              <option value="C">Tier C (Berkembang)</option>
              <option value="D">Tier D (Spekulatif)</option>
            </select>
            {tier === 'D' && (
              <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <AlertCircle size={12} /> Tier D wajib ditinjau ulang oleh Reviewer.
              </span>
            )}
          </div>

          <div className="form-group">
            <div className="flex justify-between" style={{ marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Kemungkinan Transfer</label>
              <span className="bold">{probability}%</span>
            </div>
            <input type="range" className="w-full" min="0" max="100" value={probability} onChange={(e) => setProbability(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="form-label">Status Editorial</label>
            <select className="form-select" value={pubStatus} onChange={(e: any) => setPubStatus(e.target.value)}>
              <option value="Draft">Draft</option>
              <option value="Review">Menunggu Review</option>
              <option value="Scheduled">Terjadwal</option>
              <option value="Published">Published</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Sumber Berita <span className="required">*</span></label>
            <input type="text" className="form-input" placeholder="e.g. Fabrizio Romano" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. MASTER CLUB VIEW
// ==========================================
interface ClubsListProps {
  clubs: Club[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function ClubsListView({ clubs, onCreateNew, onEdit, hasPermission }: ClubsListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Master Data</span> <ChevronRight size={10} /> <span>Klub</span>
          </div>
          <h1 className="page-title">Master Klub</h1>
          <p className="page-description">Kelola data resmi klub sepak bola, stadion, coach, dan warna identitas utama tim.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Tambah Klub
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nama Resmi</th>
              <th>Short Name</th>
              <th>Kota / Provinsi</th>
              <th>Stadion</th>
              <th>Coach</th>
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map(club => (
              <tr key={club.id}>
                <td>
                  {club.logoUrl && club.logoUrl.startsWith('http') ? (
                    <img src={club.logoUrl} alt={club.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 24 }}>{club.logoUrl || '⚽'}</span>
                  )}
                </td>
                <td><span className="semibold">{club.name}</span></td>
                <td>{club.shortName}</td>
                <td>{club.city}</td>
                <td>{club.stadium}</td>
                <td>{club.coach}</td>
                <td>
                  <div className="flex align-center gap-8">
                    <div style={{ width: 60, height: 6, backgroundColor: 'var(--neutral-200)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${club.completeness}%`, height: '100%', backgroundColor: 'var(--primary-600)' }}></div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{club.completeness}%</span>
                  </div>
                </td>
                <td className="text-right">
                  <button className="btn btn-sm btn-secondary" onClick={() => onEdit(club.id)}>
                    Edit Klub
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 9. CLUB EDITOR VIEW
// ==========================================
interface ClubEditorProps {
  clubId: string;
  clubs: Club[];
  players: Player[];
  onClose: () => void;
  onSave: (club: Club) => void;
}

function ClubEditorView({ clubId, clubs, players, onClose, onSave }: ClubEditorProps) {
  const isNew = clubId === 'new';
  const club = clubs.find(c => c.id === clubId) || {
    id: `club-${Date.now()}`,
    name: '',
    shortName: '',
    code: '',
    city: '',
    stadium: '',
    founded: 2026,
    primaryColor: '#66756A',
    secondaryColor: '#E2E8F0',
    logoUrl: '⚽',
    coach: '',
    activePlayersCount: 0,
    completeness: 50,
    status: 'active' as const
  };

  const [name, setName] = useState(club.name);
  const [shortName, setShortName] = useState(club.shortName);
  const [code, setCode] = useState(club.code);
  const [city, setCity] = useState(club.city);
  const [stadium, setStadium] = useState(club.stadium);
  const [coach, setCoach] = useState(club.coach);
  const [primaryColor, setPrimaryColor] = useState(club.primaryColor);
  const [logo, setLogo] = useState(club.logoUrl);

  const squadList = players.filter(p => p.clubId === club.id);

  const handleSave = () => {
    if (!name || !shortName || !code) {
      alert('Nama, Short Name, dan Kode Klub wajib diisi.');
      return;
    }
    const updatedClub: Club = {
      ...club,
      name,
      shortName,
      code,
      city,
      stadium,
      coach,
      primaryColor,
      logoUrl: logo,
      completeness: 100
    };
    onSave(updatedClub);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isNew ? 'Tambah Master Klub Baru' : `Edit Klub: ${club.name}`}</h2>
        </div>
        <button className="btn btn-md btn-primary" onClick={handleSave}>Simpan Klub</button>
      </div>

      <div className="grid-12">
        <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-12" style={{ gap: 16 }}>
            <div style={{ gridColumn: 'span 8' }}>
              <label className="form-label">Nama Resmi Klub <span className="required">*</span></label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 4' }}>
              <label className="form-label">Kode (3 Huruf) <span className="required">*</span></label>
              <input type="text" className="form-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="form-label">Short Name <span className="required">*</span></label>
              <input type="text" className="form-input" value={shortName} onChange={(e) => setShortName(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="form-label">Nama Pelatih</label>
              <input type="text" className="form-input" value={coach} onChange={(e) => setCoach(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="form-label">Stadion</label>
              <input type="text" className="form-input" value={stadium} onChange={(e) => setStadium(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="form-label">Kota / Provinsi</label>
              <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Emoji Logo (Simulasi)</label>
            <input type="text" className="form-input" value={logo} onChange={(e) => setLogo(e.target.value)} style={{ fontSize: 24, textAlign: 'center' }} />
          </div>

          <div>
            <label className="form-label">Warna Utama Tim</label>
            <div className="flex align-center gap-8">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: 44, height: 44, border: 'none', padding: 0 }} />
              <input type="text" className="form-input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: 16 }}>
            <span className="semibold" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Skuad Klub ({squadList.length} pemain)</span>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {squadList.map(p => (
                <div key={p.id} style={{ fontSize: 12, padding: '4px 8px', backgroundColor: 'var(--neutral-50)', borderRadius: 4 }}>
                  #{p.shirtNumber} {p.fullName} ({p.position})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. MASTER PEMAIN VIEW
// ==========================================
interface PlayersListProps {
  players: Player[];
  clubs: Club[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function PlayersListView({ players, clubs, onCreateNew, onEdit, hasPermission }: PlayersListProps) {
  const [selectedPosition, setSelectedPosition] = useState('Semua');

  const filteredPlayers = players.filter(p => selectedPosition === 'Semua' || p.position === selectedPosition);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Master Data</span> <ChevronRight size={10} /> <span>Pemain</span>
          </div>
          <h1 className="page-title">Master Pemain</h1>
          <p className="page-description">Kelola profil pemain, posisi bertanding, kewarganegaraan, nomor jersey, dan status ketersediaan.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Tambah Pemain
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <select className="form-select" style={{ maxWidth: 200 }} value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)}>
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
              <th>Nama Lengkap</th>
              <th>Display Name</th>
              <th>Klub Aktif</th>
              <th>Posisi</th>
              <th>No Punggung</th>
              <th>Status Avail</th>
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => {
              const club = clubs.find(c => c.id === player.clubId);
              return (
                <tr key={player.id}>
                  <td>
                    {player.flagUrl && player.flagUrl.startsWith('http') ? (
                      <img src={player.flagUrl} alt={player.nationality} style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{player.flagUrl}</span>
                    )}
                  </td>
                  <td><span className="semibold">{player.fullName}</span></td>
                  <td>{player.displayName}</td>
                  <td>{club?.name || 'Free Agent'}</td>
                  <td>{player.position}</td>
                  <td>#{player.shirtNumber}</td>
                  <td>
                    <span className={`badge ${player.availability === 'available' ? 'badge-success' : player.availability === 'injured' ? 'badge-danger' : 'badge-warning'}`}>
                      {player.availability}
                    </span>
                  </td>
                  <td>
                    <div className="flex align-center gap-8">
                      <div style={{ width: 60, height: 6, backgroundColor: 'var(--neutral-200)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${player.completeness}%`, height: '100%', backgroundColor: 'var(--primary-600)' }}></div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{player.completeness}%</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-sm btn-secondary" onClick={() => onEdit(player.id)}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 11. PLAYER EDITOR VIEW
// ==========================================
interface PlayerEditorProps {
  playerId: string;
  clubs: Club[];
  players: Player[];
  onClose: () => void;
  onSave: (player: Player) => void;
}

function PlayerEditorView({ playerId, clubs, players, onClose, onSave }: PlayerEditorProps) {
  const isNew = playerId === 'new';
  const player = players.find(p => p.id === playerId) || {
    id: `player-${Date.now()}`,
    fullName: '',
    displayName: '',
    clubId: clubs[0]?.id || '',
    clubName: clubs[0]?.name || '',
    position: 'Midfielder' as const,
    shirtNumber: 10,
    nationality: 'Indonesia',
    flagUrl: '🇮🇩',
    age: 25,
    contractStart: '2026-01-01',
    contractEnd: '2027-12-31',
    status: 'active' as const,
    availability: 'available' as const,
    completeness: 80
  };

  const [fullName, setFullName] = useState(player.fullName);
  const [displayName, setDisplayName] = useState(player.displayName);
  const [clubId, setClubId] = useState(player.clubId);
  const [position, setPosition] = useState(player.position);
  const [shirtNumber, setShirtNumber] = useState(player.shirtNumber);
  const [nationality, setNationality] = useState(player.nationality);
  const [flag, setFlag] = useState(player.flagUrl);
  const [availability, setAvailability] = useState(player.availability);

  const handleSave = () => {
    if (!fullName || !displayName) {
      alert('Nama Lengkap dan Display Name wajib diisi.');
      return;
    }
    const club = clubs.find(c => c.id === clubId);
    const updatedPlayer: Player = {
      ...player,
      fullName,
      displayName,
      clubId,
      clubName: club?.name || '',
      position,
      shirtNumber,
      nationality,
      flagUrl: flag,
      availability,
      completeness: 100
    };
    onSave(updatedPlayer);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isNew ? 'Tambah Master Pemain Baru' : `Edit Pemain: ${player.fullName}`}</h2>
        </div>
        <button className="btn btn-md btn-primary" onClick={handleSave}>Simpan Pemain</button>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="form-group">
          <label className="form-label">Nama Lengkap <span className="required">*</span></label>
          <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Display Name <span className="required">*</span></label>
          <input type="text" className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Klub</label>
          <select className="form-select" value={clubId} onChange={(e) => setClubId(e.target.value)}>
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid-12" style={{ gap: 16 }}>
          <div style={{ gridColumn: 'span 6' }}>
            <label className="form-label">Posisi</label>
            <select className="form-select" value={position} onChange={(e: any) => setPosition(e.target.value)}>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 6' }}>
            <label className="form-label">No Punggung</label>
            <input type="number" className="form-input" value={shirtNumber} onChange={(e) => setShirtNumber(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid-12" style={{ gap: 16, marginTop: 16 }}>
          <div style={{ gridColumn: 'span 6' }}>
            <label className="form-label">Negara / Kebangsaan</label>
            <input type="text" className="form-input" value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 6' }}>
            <label className="form-label">Emoji Bendera</label>
            <input type="text" className="form-input" value={flag} onChange={(e) => setFlag(e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Status Availabilty</label>
          <select className="form-select" value={availability} onChange={(e: any) => setAvailability(e.target.value)}>
            <option value="available">Available (Siap Tanding)</option>
            <option value="injured">Injured (Cedera)</option>
            <option value="suspended">Suspended (Akumulasi / Hukuman)</option>
            <option value="international_duty">International Duty (Timnas)</option>
            <option value="doubtful">Doubtful (Diragukan)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 12. AUDIT LOGS VIEW
// ==========================================
function AuditLogsView({ auditLogs }: { auditLogs: AuditLog[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="breadcrumb">
          <span>Dashboard</span> <ChevronRight size={10} /> <span>Audit Log</span>
        </div>
        <h1 className="page-title">Sistem Audit Log</h1>
        <p className="page-description">Daftar rekaman perubahan data penting, riwayat editing, dan validasi publish di Garuda Matchroom.</p>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User</th>
              <th>Modul</th>
              <th>Aksi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                <td><span className="semibold">{log.user}</span></td>
                <td>
                  <span className="badge badge-info">{log.module}</span>
                </td>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.action}</span>
                </td>
                <td style={{ color: 'var(--neutral-700)' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 13. GLOBAL SEARCH OVERLAY
// ==========================================
interface GlobalSearchProps {
  clubs: Club[];
  players: Player[];
  rumors: Rumor[];
  matches: Match[];
  onClose: () => void;
  onNavigate: (menu: any, id: string) => void;
}

function GlobalSearchView({ clubs, players, rumors, matches, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchClubs = clubs.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const searchPlayers = players.filter(p => p.fullName.toLowerCase().includes(query.toLowerCase()));
  const searchRumors = rumors.filter(r => r.headline.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 650, top: '15%', position: 'absolute' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex align-center gap-12" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 12, marginBottom: 16 }}>
          <Search size={20} color="var(--neutral-500)" />
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            style={{ border: 'none', padding: 0, fontSize: 16, outline: 'none', boxShadow: 'none' }}
            placeholder="Ketik nama klub, pemain, atau rumor transfer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-sm btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>

        {query ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 400, overflowY: 'auto' }}>
            {/* Clubs results */}
            {searchClubs.length > 0 && (
              <div>
                <span className="semibold text-muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Klub ({searchClubs.length})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {searchClubs.map(c => (
                    <div key={c.id} className="flex align-center justify-between" style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }} onClick={() => onNavigate('clubs', c.id)}>
                      <span>{c.logoUrl} {c.name}</span>
                      <ChevronRight size={14} color="var(--neutral-500)" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Players results */}
            {searchPlayers.length > 0 && (
              <div>
                <span className="semibold text-muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Pemain ({searchPlayers.length})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {searchPlayers.map(p => (
                    <div key={p.id} className="flex align-center justify-between" style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }} onClick={() => onNavigate('players', p.id)}>
                      <span>{p.flagUrl} {p.fullName} ({p.position})</span>
                      <ChevronRight size={14} color="var(--neutral-500)" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rumor results */}
            {searchRumors.length > 0 && (
              <div>
                <span className="semibold text-muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Rumor Transfer ({searchRumors.length})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {searchRumors.map(r => (
                    <div key={r.id} className="flex align-center justify-between" style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }} onClick={() => onNavigate('rumors', r.id)}>
                      <span style={{ fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{r.headline}</span>
                      <ChevronRight size={14} color="var(--neutral-500)" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchClubs.length === 0 && searchPlayers.length === 0 && searchRumors.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--neutral-500)' }}>
                Tidak ada hasil yang ditemukan untuk kata kunci "{query}"
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 12, color: 'var(--neutral-500)', fontSize: 13 }}>
            Gunakan navigasi panah atau ketik untuk memulai pencarian.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 14. SETTINGS VIEW
// ==========================================
interface SettingsProps {
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  uiState: string;
  setUiState: (state: any) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  triggerToast: (msg: string) => void;
}

function SettingsView({
  currentUserRole,
  setCurrentUserRole,
  uiState,
  setUiState,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  isOffline,
  setIsOffline,
  triggerToast
}: SettingsProps) {
  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Pengaturan Simulasi Demo</h2>

      {/* Role Selection */}
      <div className="form-group">
        <label className="form-label">Simulasi Hak Akses / User Role</label>
        <select className="form-select" value={currentUserRole} onChange={(e: any) => {
          setCurrentUserRole(e.target.value);
          triggerToast(`Berhasil berganti ke role ${e.target.value}`);
        }}>
          <option value="Super Admin">Super Admin (Full Akses)</option>
          <option value="Admin Data">Admin Data (Master Klub/Pemain)</option>
          <option value="Match Editor">Match Editor (Input Lineup & Hasil)</option>
          <option value="Rumor Editor">Rumor Editor (Tulis Rumor)</option>
          <option value="Reviewer">Reviewer (Menyetujui Publikasi)</option>
        </select>
        <span className="form-helper">
          Perubahan role akan menyesuaikan tombol tindakan, input validation rules, dan visibilitas dashboard secara otomatis.
        </span>
      </div>

      {/* State Switchers */}
      <div className="form-group" style={{ marginTop: 24, borderTop: '1px solid var(--neutral-200)', paddingTop: 20 }}>
        <label className="form-label">Status Aplikasi / States</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasUnsavedChanges} onChange={(e) => setHasUnsavedChanges(e.target.checked)} />
            <span>Simulasikan Perubahan Belum Disimpan (Unsaved Indicator)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={isOffline} onChange={(e) => setIsOffline(e.target.checked)} />
            <span>Mode Jaringan Terputus (Offline Warning)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
