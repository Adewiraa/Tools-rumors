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
  Competition,
  INITIAL_CLUBS,
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_RUMORS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMPETITIONS,
  calculateClubCompleteness,
  calculatePlayerCompleteness
} from '@/lib/mockData';
import { supabase, supabaseWrite } from '@/lib/supabaseClient';
import { countriesList } from '@/lib/countriesData';
import * as htmlToImage from 'html-to-image';

// User Role Definition
type UserRole = 'Super Admin' | 'Admin Data' | 'Match Editor' | 'Rumor Editor' | 'Reviewer';

// Helper to generate RFC 4122 compliant UUID v4
const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function Home() {
  // Navigation & Shell States
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'lineups' | 'results' | 'rumors' | 'clubs' | 'players' | 'competitions' | 'logs' | 'settings'>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Super Admin');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);

  // Editor states
  const [editingLineupId, setEditingLineupId] = useState<string | null>(null);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingRumorId, setEditingRumorId] = useState<string | null>(null);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingCompetitionId, setEditingCompetitionId] = useState<string | null>(null);
  const [selectedPlayerClubId, setSelectedPlayerClubId] = useState<string>('Semua');

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
            country_name,
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

        // 3. Fetch Competitions via API route (service_role, bypass RLS)
        const compRes = await fetch('/api/competitions');
        const compJson = await compRes.json();
        const competitionsData = compJson.success ? compJson.data : null;

        // 4. Fetch relasi club_competitions
        const { data: clubCompData } = await supabase
          .from('club_competitions')
          .select('club_id, competition_id');

        // Map Competitions (data dari API sudah snake_case dari DB)
        if (competitionsData && competitionsData.length > 0) {
          const mappedCompetitions: Competition[] = competitionsData.map((c: any) => ({
            id: c.id,
            name: c.name,
            shortName: c.short_name || '',
            slug: c.slug || '',
            type: (c.type || 'league') as Competition['type'],
            country: c.country || 'Indonesia',
            logoUrl: c.logo_url || '',
            season: c.season || '',
            isActive: c.is_active !== false,
          }));
          setCompetitions(mappedCompetitions);
        }

        // Bangun map: club_id -> competition_id[]
        const clubCompMap: Record<string, string[]> = {};
        if (clubCompData && clubCompData.length > 0) {
          for (const row of clubCompData) {
            if (!clubCompMap[row.club_id]) clubCompMap[row.club_id] = [];
            clubCompMap[row.club_id].push(row.competition_id);
          }
        }

        // Map Clubs (dengan competitionIds)
        if (clubsData && clubsData.length > 0) {
          const mappedClubs: Club[] = clubsData.map(c => {
            const clubData: Club = {
              id: c.id,
              name: c.name,
              shortName: c.short_name || c.name,
              code: c.slug ? c.slug.slice(0, 3).toUpperCase() : 'CLUB',
              city: c.city || '',
              stadium: c.stadium || '',
              founded: c.founded || 1945,
              homeColor: c.home_color || c.primary_color || '',
              awayColor: c.away_color || c.secondary_color || '',
              thirdColor: c.third_color || '',
              logoUrl: c.logo_public_url || '',
              coach: c.coach || '',
              activePlayersCount: 0,
              competitionIds: clubCompMap[c.id] || [],
              completeness: 0,
              status: 'active'
            };
            clubData.completeness = calculateClubCompleteness(clubData);
            return clubData;
          });
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

            const mappedPlayer: Player = {
              id: p.id,
              fullName: p.full_name,
              displayName: p.display_name || p.full_name,
              clubId,
              clubName,
              position,
              shirtNumber: roster?.shirt_number || 99,
              nationality: p.country_name || (p.country_code === 'ID' ? 'Indonesia' : 'Asing'),
              flagUrl: p.country_flag_url || '🇮🇩',
              age: 25,
              contractStart: '2025-01-01',
              contractEnd: '2028-01-01',
              status: 'active',
              availability: 'available',
              completeness: 0
            };
            mappedPlayer.completeness = calculatePlayerCompleteness(mappedPlayer);
            return mappedPlayer;
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

  // Helper to navigate and close mobile drawer
  const navigateTo = (menu: typeof activeMenu) => {
    setActiveMenu(menu);
    setMobileDrawerOpen(false);
    setEditingLineupId(null);
    setEditingResultId(null);
    setEditingRumorId(null);
    setEditingClubId(null);
    setEditingPlayerId(null);
    setEditingCompetitionId(null);
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
                <span style={{ color: 'var(--primary-600)' }}>🇮🇩</span>
                <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: 16 }}>GARUDA MATCH</span>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', padding: 4 }} onClick={() => setMobileDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
              <div className="menu-category" style={{ display: 'block' }}>Menu Utama</div>
              <div className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <Activity size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Dashboard</span>
              </div>

              <div className="menu-category" style={{ display: 'block' }}>Pertandingan</div>
              <div className={`menu-item ${activeMenu === 'lineups' ? 'active' : ''}`} onClick={() => navigateTo('lineups')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <FileText size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Lineup Tim</span>
              </div>
              <div className={`menu-item ${activeMenu === 'results' ? 'active' : ''}`} onClick={() => navigateTo('results')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <Trophy size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Hasil Pertandingan</span>
              </div>

              <div className="menu-category" style={{ display: 'block' }}>Editorial</div>
              <div className={`menu-item ${activeMenu === 'rumors' ? 'active' : ''}`} onClick={() => navigateTo('rumors')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <Radio size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Rumor & Transfer</span>
              </div>

              <div className="menu-category" style={{ display: 'block' }}>Master Data</div>
              <div className={`menu-item ${activeMenu === 'clubs' ? 'active' : ''}`} onClick={() => navigateTo('clubs')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <Shield size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Master Klub</span>
              </div>
              <div className={`menu-item ${activeMenu === 'players' ? 'active' : ''}`} onClick={() => navigateTo('players')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <User size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Master Pemain</span>
              </div>
              <div className={`menu-item ${activeMenu === 'competitions' ? 'active' : ''}`} onClick={() => navigateTo('competitions')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <Trophy size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Master Kompetisi</span>
              </div>

              <div className="menu-category" style={{ display: 'block' }}>Sistem</div>
              <div className={`menu-item ${activeMenu === 'logs' ? 'active' : ''}`} onClick={() => navigateTo('logs')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <History size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Audit Log</span>
              </div>
              <div className={`menu-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => navigateTo('settings')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>
                <Settings size={18} />
                <span style={{ display: 'inline', fontSize: 14 }}>Pengaturan</span>
              </div>
            </nav>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--navy-900)', backgroundColor: '#111417' }}>
              <div className="flex align-center gap-8">
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: 13 }}>
                  {currentUserRole[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>Admin Garuda</div>
                  <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>{currentUserRole}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Sidebar — Desktop: full sidebar, Mobile: bottom tab bar (5 main items) */}
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
          <div className={`menu-item mobile-hidden ${activeMenu === 'clubs' ? 'active' : ''}`} onClick={() => { setActiveMenu('clubs'); setEditingClubId(null); }}>
            <Shield size={18} />
            {!sidebarCollapsed && <span>Master Klub</span>}
          </div>
          <div className={`menu-item mobile-hidden ${activeMenu === 'players' ? 'active' : ''}`} onClick={() => { setActiveMenu('players'); setEditingPlayerId(null); }}>
            <User size={18} />
            {!sidebarCollapsed && <span>Master Pemain</span>}
          </div>
          <div className={`menu-item mobile-hidden ${activeMenu === 'competitions' ? 'active' : ''}`} onClick={() => { setActiveMenu('competitions'); setEditingCompetitionId(null); }}>
            <Trophy size={18} />
            {!sidebarCollapsed && <span>Master Kompetisi</span>}
          </div>

          {!sidebarCollapsed && <div className="menu-category">Sistem</div>}
          <div className={`menu-item mobile-hidden ${activeMenu === 'logs' ? 'active' : ''}`} onClick={() => setActiveMenu('logs')}>
            <History size={18} />
            {!sidebarCollapsed && <span>Audit Log</span>}
          </div>
          <div className={`menu-item mobile-hidden ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenu('settings')}>
            <Settings size={18} />
            {!sidebarCollapsed && <span>Pengaturan</span>}
          </div>

          {/* Mobile-only "More" button */}
          <div className="menu-item mobile-more-btn" onClick={() => setMobileDrawerOpen(true)}>
            <Menu size={18} />
            <span>Lainnya</span>
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
            {/* Quick Actions Dropdown */}
            {hasPermission('Lineup', 'create_edit') && (
              <div style={{ position: 'relative' }}>
                <button className="btn btn-sm btn-primary" onClick={() => {
                  if (activeMenu === 'lineups') setEditingLineupId('new');
                  else if (activeMenu === 'results') setEditingResultId('new');
                  else if (activeMenu === 'rumors') setEditingRumorId('new');
                  else if (activeMenu === 'clubs') setEditingClubId('new');
                  else if (activeMenu === 'players') setEditingPlayerId('new');
                  else if (activeMenu === 'competitions') setEditingCompetitionId('new');
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
                  competitions={competitions}
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
                    competitions={competitions}
                    onClose={() => setEditingLineupId(null)}
                    onSave={(updatedMatch) => {
                      if (editingLineupId === 'new') {
                        setMatches(prev => [updatedMatch, ...prev]);
                        logAction('CREATE_LINEUP', 'Lineup Pertandingan', `Membuat lineup baru: ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
                        triggerToast('Lineup baru berhasil dibuat!');
                      } else {
                        setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
                        logAction('UPDATE_LINEUP', 'Lineup Pertandingan', `Memperbarui formasi/lineup ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
                        triggerToast('Lineup berhasil disimpan!');
                      }
                      setEditingLineupId(null);
                    }}
                    triggerToast={triggerToast}
                    logAction={logAction}
                  />
                ) : (
                  <LineupsListView
                    matches={matches}
                    competitions={competitions}
                    uiState={uiState}
                    onCreateNew={() => setEditingLineupId('new')}
                    onEdit={setEditingLineupId}
                    onDelete={(id) => {
                      setMatches(prev => prev.filter(m => m.id !== id));
                      logAction('DELETE_LINEUP', 'Lineup Pertandingan', `Menghapus lineup match id: ${id}`);
                      triggerToast('Lineup berhasil dihapus.');
                    }}
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
                    competitions={competitions}
                    onClose={() => setEditingClubId(null)}
                    onSave={async (updatedClub) => {
                      try {
                        // 1. Simpan data klub ke Supabase
                        const res = await fetch('/api/clubs', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ club: updatedClub })
                        });
                        const result = await res.json();

                        if (!result.success) {
                          console.error('Club save error:', result.error);
                          triggerToast(`Gagal menyimpan ke database: ${result.error}`, 'error');
                          return;
                        }

                        // 2. Simpan relasi club <-> kompetisi
                        const compRes = await fetch('/api/competitions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'save_club_competitions',
                            clubId: updatedClub.id,
                            competitionIds: updatedClub.competitionIds || [],
                          })
                        });
                        const compResult = await compRes.json();

                        if (!compResult.success) {
                          // Relasi gagal — klub sudah tersimpan tapi tampilkan warning
                          console.warn('Club competitions save warning:', compResult.error);
                          triggerToast(`Klub tersimpan, tapi relasi kompetisi gagal: ${compResult.error}`, 'warning');
                        }

                        // 3. Update local state
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
                      } catch (err: any) {
                        console.error('Save club error:', err);
                        triggerToast('Terjadi kesalahan saat menyimpan. Coba lagi.', 'error');
                      }
                    }}
                  />
                ) : (
                  <ClubsListView
                    clubs={clubs}
                    uiState={uiState}
                    onCreateNew={() => setEditingClubId('new')}
                    onEdit={setEditingClubId}
                    onDelete={async (id) => {
                      try {
                        const res = await fetch('/api/clubs', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id })
                        });
                        const result = await res.json();
                        if (!result.success) {
                          triggerToast(`Gagal menghapus klub: ${result.error}`, 'error');
                          return;
                        }
                        setClubs(prev => prev.filter(c => c.id !== id));
                        logAction('DELETE_CLUB', 'Master Klub', `Menghapus klub id: ${id}`);
                        triggerToast('Klub berhasil dihapus.');
                      } catch (err: any) {
                        triggerToast('Terjadi kesalahan saat menghapus klub.', 'error');
                      }
                    }}
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
                    onSave={async (updatedPlayer) => {
                      try {
                        // Use server-side API route (service_role key, bypasses RLS)
                        const res = await fetch('/api/players', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'upsert', player: updatedPlayer })
                        });
                        const result = await res.json();

                        if (!result.success) {
                          console.error('Player save error:', result.error);
                          triggerToast(`Gagal menyimpan data pemain: ${result.error}`, 'error');
                          return;
                        }

                        // Update local state
                        if (editingPlayerId === 'new') {
                          setPlayers(prev => [...prev, updatedPlayer]);
                          logAction('CREATE_PLAYER', 'Master Pemain', `Menambah master pemain baru: ${updatedPlayer.fullName}`);
                          triggerToast('Pemain baru berhasil ditambahkan!');
                        } else {
                          setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
                          logAction('UPDATE_PLAYER', 'Master Pemain', `Memperbarui profil pemain: ${updatedPlayer.fullName}`);
                          triggerToast('Profil pemain berhasil diperbarui!');
                        }
                        setSelectedPlayerClubId(updatedPlayer.clubId);
                        setEditingPlayerId(null);
                      } catch (err: any) {
                        console.error('Save player error:', err);
                        triggerToast(`Gagal menyimpan data pemain: ${err.message || err}`, 'error');
                      }
                    }}
                  />
                ) : (
                  <PlayersListView
                    players={players}
                    clubs={clubs}
                    uiState={uiState}
                    onCreateNew={() => setEditingPlayerId('new')}
                    onEdit={(id) => {
                      const pl = players.find(p => p.id === id);
                      if (pl) {
                        setSelectedPlayerClubId(pl.clubId);
                      }
                      setEditingPlayerId(id);
                    }}
                    onDelete={async (id) => {
                      try {
                        const res = await fetch('/api/players', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id })
                        });
                        const result = await res.json();
                        if (!result.success) {
                          triggerToast(`Gagal menghapus pemain: ${result.error}`, 'error');
                          return;
                        }
                        setPlayers(prev => prev.filter(p => p.id !== id));
                        logAction('DELETE_PLAYER', 'Master Pemain', `Menghapus pemain id: ${id}`);
                        triggerToast('Pemain berhasil dihapus.');
                      } catch (err: any) {
                        triggerToast('Terjadi kesalahan saat menghapus pemain.', 'error');
                      }
                    }}
                    hasPermission={hasPermission}
                    selectedClubId={selectedPlayerClubId}
                    setSelectedClubId={setSelectedPlayerClubId}
                  />
                )
              )}

              {/* Master Kompetisi Route */}
              {activeMenu === 'competitions' && (
                editingCompetitionId ? (
                  <CompetitionEditorView
                    competitionId={editingCompetitionId}
                    competitions={competitions}
                    onClose={() => setEditingCompetitionId(null)}
                    onSave={async (updatedCompetition) => {
                      try {
                        const res = await fetch('/api/competitions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'upsert', competition: updatedCompetition })
                        });
                        const result = await res.json();
                        if (!result.success) {
                          triggerToast(`Gagal menyimpan kompetisi: ${result.error}`, 'error');
                          return;
                        }
                        if (editingCompetitionId === 'new') {
                          setCompetitions(prev => [...prev, updatedCompetition]);
                          logAction('CREATE_COMPETITION', 'Master Kompetisi', `Menambah kompetisi baru: ${updatedCompetition.name}`);
                          triggerToast('Kompetisi baru berhasil ditambahkan!');
                        } else {
                          setCompetitions(prev => prev.map(c => c.id === updatedCompetition.id ? updatedCompetition : c));
                          logAction('UPDATE_COMPETITION', 'Master Kompetisi', `Memperbarui kompetisi: ${updatedCompetition.name}`);
                          triggerToast('Kompetisi berhasil diperbarui!');
                        }
                        setEditingCompetitionId(null);
                      } catch (err: any) {
                        triggerToast('Terjadi kesalahan saat menyimpan kompetisi.', 'error');
                      }
                    }}
                    onDelete={async (id) => {
                      try {
                        const res = await fetch(`/api/competitions?id=${id}`, { method: 'DELETE' });
                        const result = await res.json();
                        if (!result.success) {
                          triggerToast(`Gagal menghapus: ${result.error}`, 'error');
                          return;
                        }
                        setCompetitions(prev => prev.filter(c => c.id !== id));
                        logAction('DELETE_COMPETITION', 'Master Kompetisi', `Menghapus kompetisi id: ${id}`);
                        triggerToast('Kompetisi berhasil dihapus!');
                        setEditingCompetitionId(null);
                      } catch (err: any) {
                        triggerToast('Terjadi kesalahan saat menghapus.', 'error');
                      }
                    }}
                  />
                ) : (
                  <CompetitionsListView
                    competitions={competitions}
                    clubs={clubs}
                    onCreateNew={() => setEditingCompetitionId('new')}
                    onEdit={setEditingCompetitionId}
                    onDelete={async (id) => {
                      try {
                        const res = await fetch(`/api/competitions?id=${id}`, { method: 'DELETE' });
                        const result = await res.json();
                        if (!result.success) {
                          triggerToast(`Gagal menghapus kompetisi: ${result.error}`, 'error');
                          return;
                        }
                        setCompetitions(prev => prev.filter(c => c.id !== id));
                        logAction('DELETE_COMPETITION', 'Master Kompetisi', `Menghapus kompetisi id: ${id}`);
                        triggerToast('Kompetisi berhasil dihapus.');
                      } catch (err: any) {
                        triggerToast('Terjadi kesalahan saat menghapus kompetisi.', 'error');
                      }
                    }}
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
  competitions: Competition[];
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div className="flex gap-12">
            <button className="btn btn-md btn-primary" onClick={async () => {
              const node = document.getElementById('lineup-story-card');
              if (!node) return;
              try {
                triggerToast('Sedang membuat gambar Instagram Story...');
                const dataUrl = await htmlToImage.toPng(node, {
                  cacheBust: true,
                  pixelRatio: 3,
                });
                const link = document.createElement('a');
                link.download = `Lineup_${match.homeClubName}_vs_${match.awayClubName}_Story.png`;
                link.href = dataUrl;
                link.click();
                triggerToast('Gambar Story berhasil diunduh!');
              } catch (err) {
                console.error(err);
                triggerToast('Gagal mengunduh gambar.');
              }
            }}>
              <Plus size={16} /> Unduh Gambar Story (9:16)
            </button>
          </div>

          {/* Public Graphic Card Preview - Instagram Story (9:16) */}
          <div 
            id="lineup-story-card"
            style={{ 
              width: 360, 
              height: 640, 
              background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)', 
              color: 'white', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: '30px 24px', 
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            {/* Background Accent Grid / Glowing Light */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', right: '-10%', height: '40%', background: 'radial-gradient(circle, rgba(15,159,154,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
            
            {/* Header */}
            <div style={{ zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#0F9F9A', letterSpacing: 2, textTransform: 'uppercase' }}>
                {match.competition || 'LIGA NUSANTARA UTAMA'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, letterSpacing: 0.5, color: '#94a3b8' }}>
                ROSTER / STARTING XI
              </div>
              <div style={{ width: 40, height: 2, backgroundColor: '#0F9F9A', margin: '8px auto 0' }}></div>
            </div>

            {/* Teams Matchup Info */}
            <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {match.homeLogo && match.homeLogo.startsWith('http') ? (
                    <img src={match.homeLogo} alt={match.homeClubName} crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 36 }}>{match.homeLogo || '🦅'}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6, color: 'white', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {match.homeClubName.split(' ')[0]}
                </div>
                <div style={{ fontSize: 9, color: '#0F9F9A', fontWeight: 600, marginTop: 2 }}>
                  ({homeFormation})
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 800, color: '#475569', letterSpacing: 1 }}>VS</div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {match.awayLogo && match.awayLogo.startsWith('http') ? (
                    <img src={match.awayLogo} alt={match.awayClubName} crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 36 }}>{match.awayLogo || '🦈'}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6, color: 'white', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {match.awayClubName.split(' ')[0]}
                </div>
                <div style={{ fontSize: 9, color: '#0F9F9A', fontWeight: 600, marginTop: 2 }}>
                  ({awayFormation})
                </div>
              </div>
            </div>

            {/* Players Lists */}
            <div style={{ zIndex: 2, display: 'flex', gap: 16, flex: 1, margin: '15px 0', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {/* Home Squad */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#0F9F9A', marginBottom: 6, borderBottom: '1px solid rgba(15,159,154,0.3)', paddingBottom: 2 }}>
                  STARTING XI
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {homeSquad.filter(p => homeStarters.includes(p.id)).slice(0, 11).map((p, idx) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ color: '#0F9F9A', fontWeight: 700, width: 14 }}>#{p.shirtNumber}</span>
                      <span style={{ color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                        {p.displayName} {homeCaptain === p.id && <span style={{ color: '#eab308', fontWeight: 'bold' }}>(C)</span>}
                      </span>
                    </div>
                  ))}
                  {homeSquad.filter(p => homeStarters.includes(p.id)).length === 0 && (
                    <div style={{ fontSize: 9, color: '#64748b' }}>Belum ada starter</div>
                  )}
                </div>
              </div>

              {/* Away Squad */}
              <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#0F9F9A', marginBottom: 6, borderBottom: '1px solid rgba(15,159,154,0.3)', paddingBottom: 2 }}>
                  STARTING XI
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {awaySquad.filter(p => awayStarters.includes(p.id)).slice(0, 11).map((p, idx) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ color: '#0F9F9A', fontWeight: 700, width: 14 }}>#{p.shirtNumber}</span>
                      <span style={{ color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                        {p.displayName} {awayCaptain === p.id && <span style={{ color: '#eab308', fontWeight: 'bold' }}>(C)</span>}
                      </span>
                    </div>
                  ))}
                  {awaySquad.filter(p => awayStarters.includes(p.id)).length === 0 && (
                    <div style={{ fontSize: 9, color: '#64748b' }}>Belum ada starter</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Watermark */}
            <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, fontSize: 9, color: '#64748b', fontWeight: 600 }}>
              <span style={{ letterSpacing: 0.5 }}>@GARUDAMATCHROOM</span>
              <span style={{ color: '#0F9F9A' }}>MEDIA STUDIO</span>
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

      {/* Instagram Graphic Export Row */}
      <div className="card" style={{ marginTop: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Instagram Feed Graphic (1:1 Ratio)</h3>
          <p className="page-description" style={{ margin: 0 }}>Gunakan template premium ini untuk mempublikasikan hasil akhir pertandingan ke feeds Instagram resmi.</p>
        </div>
        
        <button className="btn btn-md btn-primary" onClick={async () => {
          const node = document.getElementById('match-feed-card');
          if (!node) return;
          try {
            triggerToast('Sedang membuat gambar Instagram Feed...');
            const dataUrl = await htmlToImage.toPng(node, {
              cacheBust: true,
              pixelRatio: 2.7, // 400x400 -> 1080x1080
            });
            const link = document.createElement('a');
            link.download = `Result_${match.homeClubName}_vs_${match.awayClubName}_Feed.png`;
            link.href = dataUrl;
            link.click();
            triggerToast('Gambar Feed berhasil diunduh!');
          } catch (err) {
            console.error(err);
            triggerToast('Gagal mengunduh gambar.');
          }
        }}>
          Unduh Gambar Feed (1:1)
        </button>

        {/* 1:1 IG Feed Graphic */}
        <div 
          id="match-feed-card"
          style={{
            width: 400,
            height: 400,
            background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 24,
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden'
          }}
        >
          {/* Glowing Accents */}
          <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(15,159,154,0.12) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(15,159,154,0.12) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
          
          {/* Header */}
          <div style={{ zIndex: 2, textAlign: 'center', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10, width: '100%' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#0F9F9A', letterSpacing: 1.5 }}>
              {match.competition || 'LIGA NUSANTARA UTAMA'}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#0F9F9A', color: '#090d16', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
              FULL TIME
            </span>
          </div>

          {/* Scores & Names Matchup */}
          <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', width: '100%' }}>
            {/* Home */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {match.homeLogo && match.homeLogo.startsWith('http') ? (
                  <img src={match.homeLogo} alt={match.homeClubName} crossOrigin="anonymous" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 44 }}>{match.homeLogo || '🦅'}</span>
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, marginTop: 8, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                {match.homeClubName.split(' ')[0]}
              </span>
            </div>

            {/* Score Box */}
            <div style={{ display: 'flex', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 16px' }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#0F9F9A' }}>{homeScore}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>-</span>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#0F9F9A' }}>{awayScore}</span>
            </div>

            {/* Away */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {match.awayLogo && match.awayLogo.startsWith('http') ? (
                  <img src={match.awayLogo} alt={match.awayClubName} crossOrigin="anonymous" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 44 }}>{match.awayLogo || '🦈'}</span>
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, marginTop: 8, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                {match.awayClubName.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Goals Timeline */}
          <div style={{ zIndex: 2, flex: 1, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 6, width: '100%', minHeight: 80 }}>
            {events.filter(e => e.type === 'goal').map((evt) => (
              <div key={evt.id} style={{ display: 'flex', justifyContent: evt.clubId === match.homeClubId ? 'flex-start' : 'flex-end', fontSize: 11, color: '#e2e8f0' }}>
                {evt.clubId === match.homeClubId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: '#0F9F9A' }}>{evt.minute}'</span>
                    <span>⚽ {evt.playerName}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{evt.playerName} ⚽</span>
                    <span style={{ fontWeight: 700, color: '#0F9F9A' }}>{evt.minute}'</span>
                  </div>
                )}
              </div>
            ))}
            {events.filter(e => e.type === 'goal').length === 0 && (
              <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 12 }}>Tidak ada gol tercipta</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ zIndex: 2, display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, fontSize: 9, color: '#64748b', fontWeight: 600, marginTop: 12, width: '100%' }}>
            <span>@GARUDAMATCHROOM</span>
            <span style={{ color: '#0F9F9A' }}>INSTAGRAM LIVE FEED</span>
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
  const [transferStatus, setTransferStatus] = useState(rumor.transferStatus || 'Rumor');

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
      transferStatus: transferStatus as any,
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
            <label className="form-label">Transfer Status</label>
            <select className="form-select" value={transferStatus} onChange={(e: any) => {
              const val = e.target.value;
              setTransferStatus(val);
              if (val === 'Here We Go') {
                setProbability(100);
              }
            }}>
              <option value="Rumor">Rumor</option>
              <option value="Advanced Talks">Dalam Negosiasi</option>
              <option value="Here We Go">Here We Go! / Done Deal</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Sumber Berita <span className="required">*</span></label>
            <input type="text" className="form-input" placeholder="e.g. Fabrizio Romano" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Instagram Graphic Export Row */}
      <div className="card" style={{ marginTop: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Instagram Transfer Rumor Graphics</h3>
          <p className="page-description" style={{ margin: 0 }}>Gunakan template story (dan feed done deal) untuk dipublikasikan ke media sosial Instagram.</p>
        </div>

        <div className="flex gap-24 justify-center w-full" style={{ flexWrap: 'wrap' }}>
          {/* Card 1: Story Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-md btn-primary" onClick={async () => {
              const node = document.getElementById('rumor-story-card');
              if (!node) return;
              try {
                triggerToast('Sedang membuat gambar Instagram Story...');
                const dataUrl = await htmlToImage.toPng(node, {
                  cacheBust: true,
                  pixelRatio: 3, // 360x640 -> 1080x1920
                });
                const link = document.createElement('a');
                link.download = `Rumor_${playerName.replace(/\s+/g, '_')}_Story.png`;
                link.href = dataUrl;
                link.click();
                triggerToast('Gambar Story berhasil diunduh!');
              } catch (err) {
                console.error(err);
                triggerToast('Gagal mengunduh gambar.');
              }
            }}>
              Unduh Gambar Story (9:16)
            </button>

            {/* Story Card */}
            <div 
              id="rumor-story-card"
              style={{
                width: 360,
                height: 640,
                background: 'linear-gradient(180deg, #070a13 0%, #0f172a 100%)',
                color: 'white',
                padding: '30px 24px',
                borderRadius: 12,
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'system-ui, sans-serif',
                overflow: 'hidden'
              }}
            >
              {/* Background Glow based on reliability tier */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '-15%', 
                  left: '-15%', 
                  right: '-15%', 
                  height: '45%', 
                  background: `radial-gradient(circle, ${tier === 'A' ? 'rgba(16,185,129,0.15)' : tier === 'B' ? 'rgba(14,165,233,0.15)' : tier === 'C' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'} 0%, rgba(0,0,0,0) 70%)`, 
                  pointerEvents: 'none' 
                }}
              ></div>

              {/* Header */}
              <div style={{ zIndex: 2, textAlign: 'center' }}>
                <span 
                  style={{ 
                    fontSize: 9, 
                    fontWeight: 800, 
                    padding: '3px 8px', 
                    borderRadius: 4, 
                    backgroundColor: tier === 'A' ? '#10b981' : tier === 'B' ? '#0ea5e9' : tier === 'C' ? '#f59e0b' : '#ef4444',
                    color: '#070a13',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                >
                  RELIABILITY TIER {tier}
                </span>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                  RUMOR & TRANSFER UPDATE
                </div>
              </div>

              {/* Headline */}
              <div style={{ zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                <div 
                  style={{ 
                    fontSize: 20, 
                    fontWeight: 900, 
                    lineHeight: 1.3, 
                    textAlign: 'center', 
                    color: '#f8fafc',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {headline || 'Judul artikel transfer rumor...'}
                </div>

                <div 
                  style={{ 
                    padding: 16, 
                    borderRadius: 8, 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F9F9A', textAlign: 'center' }}>
                    {playerName || 'Nama Pemain'}
                  </div>
                  
                  <div style={{ display: 'flex', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Klub Asal</div>
                      <div style={{ fontWeight: 700, color: 'white', marginTop: 2 }}>{fromClub || 'Free Agent'}</div>
                    </div>
                    <div style={{ fontSize: 14, color: '#0F9F9A' }}>➜</div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Klub Tujuan</div>
                      <div style={{ fontWeight: 700, color: 'white', marginTop: 2 }}>{destClub || 'Belum Ditentukan'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 9, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Peluang</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0F9F9A' }}>{probability}%</span>
                  </div>
                  <div style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 9, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Status</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{transferStatus}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                <span>SUMBER: {sourceName || 'Kanal Terpercaya'}</span>
                <span style={{ color: '#0F9F9A' }}>@GARUDAMATCHROOM</span>
              </div>
            </div>
          </div>

          {/* Card 2: Done Deal Feed Preview (Only if Here We Go) */}
          {transferStatus === 'Here We Go' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-md btn-primary" onClick={async () => {
                const node = document.getElementById('rumor-feed-card');
                if (!node) return;
                try {
                  triggerToast('Sedang membuat gambar Instagram Done Deal Feed...');
                  const dataUrl = await htmlToImage.toPng(node, {
                    cacheBust: true,
                    pixelRatio: 2.7, // 400x400 -> 1080x1080
                  });
                  const link = document.createElement('a');
                  link.download = `DoneDeal_${playerName.replace(/\s+/g, '_')}_Feed.png`;
                  link.href = dataUrl;
                  link.click();
                  triggerToast('Gambar Feed Done Deal berhasil diunduh!');
                } catch (err) {
                  console.error(err);
                  triggerToast('Gagal mengunduh gambar.');
                }
              }}>
                Unduh Gambar Feed Done Deal (1:1)
              </button>

              {/* Feed Card */}
              <div 
                id="rumor-feed-card"
                style={{
                  width: 400,
                  height: 400,
                  background: 'radial-gradient(circle at center, #0b1528 0%, #030712 100%)',
                  color: 'white',
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-lg)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontFamily: 'system-ui, sans-serif',
                  overflow: 'hidden'
                }}
              >
                {/* Glowing neon border pattern */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, border: '4px solid #0F9F9A', opacity: 0.25, pointerEvents: 'none' }}></div>
                
                {/* Header */}
                <div style={{ zIndex: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
                  <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: 4, color: '#0F9F9A', textShadow: '0 0 10px rgba(15,159,154,0.5)', textTransform: 'uppercase' }}>
                    DONE DEAL
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#eab308', letterSpacing: 1, textTransform: 'uppercase', backgroundColor: 'rgba(234,179,8,0.1)', padding: '3px 10px', borderRadius: 10 }}>
                    TRANSFER RESMI
                  </span>
                  
                  <div style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', color: 'white', textTransform: 'uppercase', lineHeight: 1.1 }}>
                    {playerName || 'Nama Pemain'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px 20px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontWeight: 600, color: '#94a3b8' }}>{fromClub || 'Klub Asal'}</span>
                    <span style={{ color: '#0F9F9A', fontWeight: 800 }}>➜</span>
                    <span style={{ fontWeight: 800, color: 'white' }}>{destClub || 'Klub Tujuan'}</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                  <span>PUBLISHED BY GM STUDIO</span>
                  <span style={{ color: '#0F9F9A', letterSpacing: 0.5 }}>@GARUDAMATCHROOM</span>
                </div>
              </div>
            </div>
          )}
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
  onDelete: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function ClubsListView({ clubs, onCreateNew, onEdit, onDelete, hasPermission }: ClubsListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => onEdit(club.id)}>
                      <Edit size={13} /> Edit
                    </button>
                    {hasPermission('Master', 'delete') && (
                      confirmDeleteId === club.id ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                          <button className="btn btn-sm btn-danger" onClick={() => { onDelete(club.id); setConfirmDeleteId(null); }}>Ya</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                        </span>
                      ) : (
                        <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(club.id)}>
                          <Trash2 size={13} />
                        </button>
                      )
                    )}
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

// ==========================================
// 9. CLUB EDITOR VIEW
// ==========================================
interface ClubEditorProps {
  clubId: string;
  clubs: Club[];
  players: Player[];
  competitions: Competition[];
  onClose: () => void;
  onSave: (club: Club) => void;
}

function ClubEditorView({ clubId, clubs, players, competitions, onClose, onSave }: ClubEditorProps) {
  const isNew = clubId === 'new';
  const club = clubs.find(c => c.id === clubId) || {
    id: generateUUID(),
    name: '',
    shortName: '',
    code: '',
    city: '',
    stadium: '',
    founded: 2026,
    homeColor: '#66756A',
    awayColor: '#E2E8F0',
    thirdColor: '',
    logoUrl: '',
    coach: '',
    activePlayersCount: 0,
    completeness: 0,
    status: 'active' as const
  };

  const [name, setName] = useState(club.name);
  const [shortName, setShortName] = useState(club.shortName);
  const [code, setCode] = useState(club.code);
  const [city, setCity] = useState(club.city);
  const [stadium, setStadium] = useState(club.stadium);
  const [coach, setCoach] = useState(club.coach);
  const [homeColor, setHomeColor] = useState(club.homeColor);
  const [awayColor, setAwayColor] = useState(club.awayColor);
  const [thirdColor, setThirdColor] = useState(club.thirdColor);
  const [logo, setLogo] = useState(club.logoUrl);
  const [uploading, setUploading] = useState(false);
  const [selectedCompetitionIds, setSelectedCompetitionIds] = useState<string[]>(club.competitionIds || []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const clubSlug = code ? code.toLowerCase() : 'club';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${clubSlug}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('club-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('club-logos')
        .getPublicUrl(filePath);

      setLogo(publicUrl);
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      alert(`Gagal mengunggah logo: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const squadList = players.filter(p => p.clubId === club.id);

  // Calculate live completeness based on current form state
  const liveCompleteness = calculateClubCompleteness({
    name, shortName, code, city, stadium, coach, logoUrl: logo,
    homeColor, awayColor, thirdColor
  });

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
      homeColor,
      awayColor,
      thirdColor,
      logoUrl: logo,
      competitionIds: selectedCompetitionIds,
      completeness: calculateClubCompleteness({
        name, shortName, code, city, stadium, coach, logoUrl: logo,
        homeColor, awayColor, thirdColor
      })
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
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isNew ? 'Tambah Master Klub Baru' : `Edit Klub: ${club.name}`}</h2>
            <div className="flex align-center gap-8" style={{ marginTop: 4 }}>
              <div style={{ width: 80, height: 6, backgroundColor: 'var(--neutral-200)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${liveCompleteness}%`, height: '100%', backgroundColor: liveCompleteness >= 80 ? 'var(--success-600)' : liveCompleteness >= 50 ? 'var(--warning-600)' : 'var(--danger-600)', transition: 'width 0.3s ease' }}></div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: liveCompleteness >= 80 ? 'var(--success-600)' : liveCompleteness >= 50 ? 'var(--warning-600)' : 'var(--danger-600)' }}>Kelengkapan: {liveCompleteness}%</span>
            </div>
          </div>
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
            <label className="form-label">Logo Klub (HD)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logo && logo.startsWith('http') ? (
                  <img src={logo} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                ) : (
                  <Shield size={24} color="var(--neutral-300)" />
                )}
              </div>
              <div style={{ flex: 1, fontSize: 11, color: 'var(--neutral-500)' }}>
                {logo && logo.startsWith('http') ? 'Logo HD tersimpan' : 'Belum ada logo'}
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                style={{ display: 'none' }} 
                id="club-logo-file-input"
                disabled={uploading}
              />
              <label 
                htmlFor="club-logo-file-input" 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: uploading ? 'not-allowed' : 'pointer', width: '100%', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, height: 38, fontSize: 12 }}
              >
                {uploading ? (
                  <span>Mengunggah Logo HD...</span>
                ) : (
                  <>
                    <Upload size={14} />
                    Unggah Logo (HD)
                  </>
                )}
              </label>
            </div>
            
            {logo && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--neutral-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                  {logo}
                </span>
                <button 
                  type="button" 
                  onClick={() => setLogo('')} 
                  style={{ background: 'none', border: 'none', color: 'var(--danger-600)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                >
                  Hapus
                </button>
              </div>
            )}
          </div>

          {/* Team Colors - Home, Away, Third */}
          <div>
            <label className="form-label">Warna Tim</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-700)', display: 'block', marginBottom: 4 }}>Home</span>
                <div className="flex align-center gap-8">
                  <input type="color" value={homeColor} onChange={(e) => setHomeColor(e.target.value)} style={{ width: 36, height: 36, border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)', padding: 2, cursor: 'pointer' }} />
                  <input type="text" className="form-input" value={homeColor} onChange={(e) => setHomeColor(e.target.value)} style={{ fontSize: 12 }} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-700)', display: 'block', marginBottom: 4 }}>Away</span>
                <div className="flex align-center gap-8">
                  <input type="color" value={awayColor} onChange={(e) => setAwayColor(e.target.value)} style={{ width: 36, height: 36, border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)', padding: 2, cursor: 'pointer' }} />
                  <input type="text" className="form-input" value={awayColor} onChange={(e) => setAwayColor(e.target.value)} style={{ fontSize: 12 }} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-700)', display: 'block', marginBottom: 4 }}>Third</span>
                <div className="flex align-center gap-8">
                  <input type="color" value={thirdColor || '#000000'} onChange={(e) => setThirdColor(e.target.value)} style={{ width: 36, height: 36, border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)', padding: 2, cursor: 'pointer' }} />
                  <input type="text" className="form-input" value={thirdColor} onChange={(e) => setThirdColor(e.target.value)} placeholder="Opsional" style={{ fontSize: 12 }} />
                </div>
              </div>
            </div>
            {/* Color Preview Swatches */}
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--neutral-500)', fontWeight: 600 }}>Preview:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', backgroundColor: homeColor, border: '1px solid var(--neutral-200)' }} title="Home"></div>
                <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', backgroundColor: awayColor, border: '1px solid var(--neutral-200)' }} title="Away"></div>
                {thirdColor && <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', backgroundColor: thirdColor, border: '1px solid var(--neutral-200)' }} title="Third"></div>}
              </div>
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

          {/* Kompetisi yang Diikuti */}
          <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: 16 }}>
            <span className="semibold" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Kompetisi yang Diikuti ({selectedCompetitionIds.length} dipilih)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {competitions.map(comp => {
                const isSelected = selectedCompetitionIds.includes(comp.id);
                return (
                  <label
                    key={comp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isSelected ? 'var(--primary-600)' : 'var(--neutral-200)'}`,
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedCompetitionIds(prev =>
                          prev.includes(comp.id)
                            ? prev.filter(id => id !== comp.id)
                            : [...prev, comp.id]
                        );
                      }}
                      style={{ accentColor: 'var(--primary-600)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-900)' }}>{comp.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--neutral-500)' }}>
                        {comp.type === 'league' ? 'Liga' : comp.type === 'cup' ? 'Piala' : 'Friendly'} · {comp.season} · {comp.country}
                      </div>
                    </div>
                    {!comp.isActive && (
                      <span className="badge badge-draft" style={{ fontSize: 9, padding: '1px 6px' }}>Nonaktif</span>
                    )}
                  </label>
                );
              })}
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
  onDelete: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
  selectedClubId: string;
  setSelectedClubId: (id: string) => void;
}

function PlayersListView({ 
  players, 
  clubs, 
  onCreateNew, 
  onEdit,
  onDelete,
  hasPermission,
  selectedClubId,
  setSelectedClubId
}: PlayersListProps) {
  const [selectedPosition, setSelectedPosition] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Default to first club if selectedClubId is 'Semua' or empty to prevent listing all players
  useEffect(() => {
    if ((selectedClubId === 'Semua' || !selectedClubId) && clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId, setSelectedClubId]);

  const filteredPlayers = players.filter(p => {
    const matchClub = selectedClubId === 'Semua' || p.clubId === selectedClubId;
    const matchPosition = selectedPosition === 'Semua' || p.position === selectedPosition;
    return matchClub && matchPosition;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Master Data</span> <ChevronRight size={10} /> <span>Pemain</span>
          </div>
          <h1 className="page-title">Master Pemain</h1>
          <p className="page-description">Kelola profil pemain, posisi bertanding, kewarganegaraan, dan nomor punggung jersey.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Tambah Pemain
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>Pilih Klub</label>
          <select className="form-select" value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)}>
            <option value="Semua">Semua Klub</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>Pilih Posisi</label>
          <select className="form-select" value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)}>
            <option value="Semua">Semua Posisi</option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
          </select>
        </div>
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
              <th>Kelengkapan</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => {
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
                      <div className="flex align-center gap-8">
                        <div style={{ width: 60, height: 6, backgroundColor: 'var(--neutral-200)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${player.completeness}%`, height: '100%', backgroundColor: player.completeness >= 80 ? 'var(--success-600)' : player.completeness >= 50 ? 'var(--warning-600)' : 'var(--danger-600)' }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{player.completeness}%</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(player.id)}>
                          <Edit size={13} /> Edit
                        </button>
                        {hasPermission('Master', 'delete') && (
                          confirmDeleteId === player.id ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                              <button className="btn btn-sm btn-danger" onClick={() => { onDelete(player.id); setConfirmDeleteId(null); }}>Ya</button>
                              <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                            </span>
                          ) : (
                            <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(player.id)}>
                              <Trash2 size={13} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center" style={{ color: 'var(--neutral-500)', padding: '24px 0' }}>
                  Tidak ada data pemain untuk filter ini.
                </td>
              </tr>
            )}
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

// Global cache to persist country list across component mounts to save API quota and make loading instant
let globalCountriesCache: any[] = [];

function PlayerEditorView({ playerId, clubs, players, onClose, onSave }: PlayerEditorProps) {
  const isNew = playerId === 'new';
  const player = players.find(p => p.id === playerId) || {
    id: generateUUID(),
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
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // Calculate live completeness score
  const liveCompleteness = calculatePlayerCompleteness({
    fullName,
    displayName,
    clubId,
    position,
    shirtNumber,
    nationality,
    flagUrl: flag
  });

  // Filter countries client-side based on search query using local static list
  const filteredCountries = countrySearch.trim()
    ? countriesList.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : countriesList;

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
      completeness: liveCompleteness
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
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isNew ? 'Tambah Master Pemain Baru' : `Edit Pemain: ${player.fullName}`}</h2>
            <div className="flex align-center gap-8" style={{ marginTop: 4 }}>
              <div style={{ width: 80, height: 6, backgroundColor: 'var(--neutral-200)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${liveCompleteness}%`, height: '100%', backgroundColor: liveCompleteness >= 80 ? 'var(--success-600)' : liveCompleteness >= 50 ? 'var(--warning-600)' : 'var(--danger-600)', transition: 'width 0.3s ease' }}></div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: liveCompleteness >= 80 ? 'var(--success-600)' : liveCompleteness >= 50 ? 'var(--warning-600)' : 'var(--danger-600)' }}>Kelengkapan: {liveCompleteness}%</span>
            </div>
          </div>
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

        {/* Country Searchable Dropdown */}
        <div className="form-group" style={{ marginTop: 16, position: 'relative' }}>
          <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} /> Negara / Kewarganegaraan
          </label>
          {/* Selected flag preview */}
          {flag && (
            <div className="flex align-center gap-8" style={{ marginBottom: 8 }}>
              {flag.startsWith('http') ? (
                <img src={flag} alt={nationality} style={{ width: 32, height: 21, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--neutral-300)' }} />
              ) : (
                <span style={{ fontSize: 20 }}>{flag}</span>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-800)' }}>{nationality}</span>
              <button type="button" onClick={() => { setFlag(''); setNationality(''); }} style={{ marginLeft: 4, fontSize: 11, color: 'var(--neutral-500)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>✕ hapus</button>
            </div>
          )}
          {/* Trigger to open dropdown */}
          <div
            className="form-input"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}
            onClick={() => {
              setCountryDropdownOpen(prev => !prev);
            }}
          >
            <Search size={14} style={{ color: 'var(--neutral-400)', flexShrink: 0 }} />
            <span style={{ color: nationality ? 'var(--neutral-800)' : 'var(--neutral-400)', fontSize: 13 }}>
              {nationality || 'Klik untuk pilih negara...'}
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--neutral-400)', fontSize: 10 }}>{countryDropdownOpen ? '▲' : '▼'}</span>
          </div>

          {/* Dropdown panel */}
          {countryDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--neutral-200)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4 }}>
              {/* Search inside dropdown */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--neutral-200)' }}>
                <input
                  autoFocus
                  type="text"
                  className="form-input"
                  placeholder="Ketik nama negara..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  style={{ fontSize: 13 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {/* Country list */}
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {filteredCountries.length === 0 ? (
                  <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--neutral-500)', fontSize: 13 }}>Negara tidak ditemukan</div>
                ) : (
                  filteredCountries.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex align-center gap-10"
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--neutral-100)', backgroundColor: nationality === item.name ? 'var(--primary-50)' : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--neutral-50)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = nationality === item.name ? 'var(--primary-50)' : 'transparent')}
                      onClick={() => {
                        setNationality(item.name);
                        setFlag(item.flagUrl);
                        setCountryDropdownOpen(false);
                        setCountrySearch('');
                      }}
                    >
                      {item.flagUrl ? (
                        <img src={item.flagUrl} alt={item.name} style={{ width: 28, height: 18, objectFit: 'cover', borderRadius: 2, border: '1px solid var(--neutral-200)', flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: 28, fontSize: 18 }}>🏳️</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                      {nationality === item.name && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--primary-600)', fontWeight: 700 }}>✓</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
// 14. MASTER KOMPETISI LIST VIEW
// ==========================================
interface CompetitionsListProps {
  competitions: Competition[];
  clubs: Club[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function CompetitionsListView({ competitions, clubs, onCreateNew, onEdit, onDelete, hasPermission }: CompetitionsListProps) {
  const [filterType, setFilterType] = useState('Semua');
  const [filterActive, setFilterActive] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = competitions.filter(c => {
    const matchType = filterType === 'Semua' || c.type === filterType;
    const matchActive = filterActive === 'Semua' || (filterActive === 'Aktif' ? c.isActive : !c.isActive);
    return matchType && matchActive;
  });

  const getClubsForCompetition = (compId: string) =>
    clubs.filter(cl => (cl.competitionIds || []).includes(compId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Master Data</span> <ChevronRight size={10} /> <span>Kompetisi</span>
          </div>
          <h1 className="page-title">Master Kompetisi</h1>
          <p className="page-description">Kelola data kompetisi sepak bola — liga, piala, dan turnamen yang diikuti klub-klub dalam sistem.</p>
        </div>
        {hasPermission('Master', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Tambah Kompetisi
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-select" style={{ maxWidth: 180 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="Semua">Semua Tipe</option>
          <option value="league">Liga</option>
          <option value="cup">Piala</option>
          <option value="friendly">Friendly</option>
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="Semua">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>
          {filtered.length} kompetisi ditemukan
        </span>
      </div>

      {/* Stats Summary */}
      <div className="grid-12">
        {[
          { label: 'Total Kompetisi', value: competitions.length, color: 'var(--primary-600)' },
          { label: 'Aktif', value: competitions.filter(c => c.isActive).length, color: 'var(--success-600)' },
          { label: 'Liga', value: competitions.filter(c => c.type === 'league').length, color: 'var(--info-600, #0ea5e9)' },
          { label: 'Piala', value: competitions.filter(c => c.type === 'cup').length, color: 'var(--warning-600)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ gridColumn: 'span 3', padding: '16px 20px' }}>
            <div className="text-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Belum ada kompetisi</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Tambah kompetisi baru atau ubah filter.</p>
          <button className="btn btn-sm btn-primary" onClick={onCreateNew}>Tambah Kompetisi</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Kompetisi</th>
                <th>Kode</th>
                <th>Tipe</th>
                <th>Negara</th>
                <th>Musim</th>
                <th>Klub Peserta</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(comp => {
                const peserta = getClubsForCompetition(comp.id);
                return (
                  <tr key={comp.id}>
                    <td>
                      <div className="flex align-center gap-8">
                        <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: 'var(--primary-50)', border: '1px solid var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {comp.logoUrl && comp.logoUrl.startsWith('http') ? (
                            <img src={comp.logoUrl} alt={comp.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                          ) : (
                            <Trophy size={16} color="var(--primary-600)" />
                          )}
                        </div>
                        <div>
                          <div className="semibold">{comp.name}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{comp.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, backgroundColor: 'var(--neutral-100)', padding: '2px 6px', borderRadius: 4 }}>
                        {comp.shortName}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${comp.type === 'league' ? 'badge-info' : comp.type === 'cup' ? 'badge-warning' : 'badge-draft'}`}>
                        {comp.type === 'league' ? 'Liga' : comp.type === 'cup' ? 'Piala' : 'Friendly'}
                      </span>
                    </td>
                    <td>{comp.country}</td>
                    <td>{comp.season || '-'}</td>
                    <td>
                      <div className="flex align-center gap-6" style={{ flexWrap: 'wrap', maxWidth: 200 }}>
                        {peserta.length === 0 ? (
                          <span className="text-muted" style={{ fontSize: 11 }}>Belum ada</span>
                        ) : (
                          <>
                            {peserta.slice(0, 3).map(cl => (
                              <span key={cl.id} style={{ fontSize: 10, backgroundColor: 'var(--neutral-100)', padding: '2px 6px', borderRadius: 10, fontWeight: 500 }}>
                                {cl.shortName || cl.name}
                              </span>
                            ))}
                            {peserta.length > 3 && (
                              <span style={{ fontSize: 10, color: 'var(--neutral-500)' }}>+{peserta.length - 3} lainnya</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${comp.isActive ? 'badge-success' : 'badge-draft'}`}>
                        {comp.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(comp.id)}>
                          <Edit size={13} /> Edit
                        </button>
                        {hasPermission('Master', 'delete') && (
                          confirmDeleteId === comp.id ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                              <button className="btn btn-sm btn-danger" onClick={() => { onDelete(comp.id); setConfirmDeleteId(null); }}>Ya</button>
                              <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                            </span>
                          ) : (
                            <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(comp.id)}>
                              <Trash2 size={13} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 15. COMPETITION EDITOR VIEW
// ==========================================
interface CompetitionEditorProps {
  competitionId: string;
  competitions: Competition[];
  onClose: () => void;
  onSave: (competition: Competition) => void;
  onDelete: (id: string) => void;
}

function CompetitionEditorView({ competitionId, competitions, onClose, onSave, onDelete }: CompetitionEditorProps) {
  const isNew = competitionId === 'new';
  const existing = competitions.find(c => c.id === competitionId);
  const defaultComp: Competition = {
    id: generateUUID(),
    name: '',
    shortName: '',
    slug: '',
    type: 'league',
    country: 'Indonesia',
    logoUrl: '',
    season: '2026/27',
    isActive: true,
  };
  const comp = existing || defaultComp;

  const [name, setName] = useState(comp.name);
  const [shortName, setShortName] = useState(comp.shortName);
  const [slug, setSlug] = useState(comp.slug);
  const [type, setType] = useState<Competition['type']>(comp.type);
  const [country, setCountry] = useState(comp.country);
  const [logoUrl, setLogoUrl] = useState(comp.logoUrl);
  const [season, setSeason] = useState(comp.season);
  const [isActive, setIsActive] = useState(comp.isActive);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const folderSlug = (slug || name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'competition';
      const filePath = `${folderSlug}/${fileName}`;

      const { error } = await supabase.storage
        .from('competition-logos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('competition-logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
    } catch (err: any) {
      console.error('Error uploading competition logo:', err);
      alert(`Gagal mengunggah logo: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Auto-generate slug dari name
  const handleNameChange = (val: string) => {
    setName(val);
    if (isNew) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSave = () => {
    if (!name || !shortName) {
      alert('Nama dan Kode Singkat wajib diisi.');
      return;
    }
    const updated: Competition = {
      ...comp,
      name,
      shortName,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      type,
      country,
      logoUrl,
      season,
      isActive,
    };
    onSave(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 16 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {isNew ? 'Tambah Kompetisi Baru' : `Edit Kompetisi: ${comp.name}`}
            </h2>
            <div className="breadcrumb" style={{ marginTop: 4 }}>
              <span>Master Data</span> <ChevronRight size={10} /> <span>Kompetisi</span>
            </div>
          </div>
        </div>
        <div className="flex gap-12">
          {!isNew && (
            <button className="btn btn-md btn-secondary" style={{ color: 'var(--danger-600)', borderColor: 'var(--danger-600)' }} onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={16} /> Hapus
            </button>
          )}
          <button className="btn btn-md btn-primary" onClick={handleSave}>
            Simpan Kompetisi
          </button>
        </div>
      </div>

      <div className="grid-12">
        {/* Form utama */}
        <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-12" style={{ gap: 16 }}>
            <div style={{ gridColumn: 'span 8' }}>
              <label className="form-label">Nama Lengkap Kompetisi <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Liga Nusantara Utama"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: 'span 4' }}>
              <label className="form-label">Kode Singkat <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="LNU"
                value={shortName}
                onChange={e => setShortName(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>

            <div style={{ gridColumn: 'span 12' }}>
              <label className="form-label">Slug URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="liga-nusantara-utama"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              />
              <span className="form-helper">Auto-generate dari nama. Digunakan sebagai identifier URL.</span>
            </div>

            <div style={{ gridColumn: 'span 4' }}>
              <label className="form-label">Tipe Kompetisi</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value as Competition['type'])}>
                <option value="league">Liga</option>
                <option value="cup">Piala / Cup</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 4' }}>
              <label className="form-label">Negara / Zona</label>
              <input
                type="text"
                className="form-input"
                placeholder="Indonesia"
                value={country}
                onChange={e => setCountry(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 4' }}>
              <label className="form-label">Musim</label>
              <input
                type="text"
                className="form-input"
                placeholder="2026/27"
                value={season}
                onChange={e => setSeason(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 12' }}>
              <label className="form-label">Logo Kompetisi (HD)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {logoUrl && logoUrl.startsWith('http') ? (
                    <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  ) : (
                    <Trophy size={24} color="var(--neutral-300)" />
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                  {logoUrl && logoUrl.startsWith('http') ? 'Logo berhasil diunggah' : 'Belum ada logo'}
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  id="competition-logo-file-input"
                  disabled={uploading}
                />
                <label
                  htmlFor="competition-logo-file-input"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: uploading ? 'not-allowed' : 'pointer', width: '100%', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, height: 38, fontSize: 12 }}
                >
                  {uploading ? (
                    <span>Mengunggah Logo...</span>
                  ) : (
                    <><Upload size={14} /> Unggah Logo Kompetisi (HD)</>
                  )}
                </label>
              </div>

              {logoUrl && logoUrl.startsWith('http') && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--neutral-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    {logoUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-600)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar status */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Preview */}
          <div style={{ textAlign: 'center', padding: 20, backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--neutral-300)' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={name} style={{ width: 72, height: 72, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
            ) : (
              <div style={{ width: 72, height: 72, backgroundColor: 'var(--primary-100)', borderRadius: 12, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={32} color="var(--primary-600)" />
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--neutral-900)' }}>{name || 'Nama Kompetisi'}</div>
            <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 4 }}>
              {type === 'league' ? 'Liga' : type === 'cup' ? 'Piala' : 'Friendly'} · {country}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                {shortName || 'KODE'}
              </span>
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <label className="form-label">Status Kompetisi</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[true, false].map(val => (
                <label
                  key={String(val)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: `1px solid ${isActive === val ? 'var(--primary-600)' : 'var(--neutral-200)'}`,
                    backgroundColor: isActive === val ? 'var(--primary-50)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="isActive"
                    checked={isActive === val}
                    onChange={() => setIsActive(val)}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{val ? 'Aktif' : 'Nonaktif'}</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                      {val ? 'Tersedia untuk dipilih di master klub' : 'Disembunyikan dari pilihan'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Info musim */}
          <div style={{ padding: 12, backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--neutral-600)' }}>
            <Info size={13} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--primary-600)' }} />
            Kompetisi yang aktif akan muncul sebagai pilihan di form Master Klub. Nonaktifkan musim yang sudah selesai.
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--danger-600)' }}>Hapus Kompetisi?</h3>
            <p style={{ fontSize: 13, color: 'var(--neutral-700)', marginBottom: 20 }}>
              Kompetisi <strong>{comp.name}</strong> akan dihapus permanen. Relasi ke klub juga akan ikut terhapus.
            </p>
            <div className="flex gap-12 justify-between">
              <button className="btn btn-md btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Batal</button>
              <button className="btn btn-md btn-danger" onClick={() => { setShowDeleteConfirm(false); onDelete(comp.id); }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 16. SETTINGS VIEW
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
