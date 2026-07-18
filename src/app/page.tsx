'use client'; // build-fix-v2

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
  Lock,
  Download,
  Share2
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
type ActiveMenu = 'dashboard' | 'schedule' | 'lineups' | 'results' | 'rumors' | 'clubs' | 'players' | 'competitions' | 'logs' | 'settings';

const APP_NAME = 'Gosball';
const APP_LOGO_SRC = '/brand/gosball-alt.png';
const APP_HANDLE = '@GOSBALL';

const NAV_SECTIONS: {
  title: string;
  items: { id: ActiveMenu; label: string; icon: React.ElementType; mobileHidden?: boolean }[];
}[] = [
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

const hasSavedLineupSelection = (match: Match) => Boolean(
  match.homeStarters?.length ||
  match.awayStarters?.length ||
  match.homeSubs?.length ||
  match.awaySubs?.length
);

const hasPublishedLineupSnapshot = (match: Match) => (
  match.publicationStatus === 'Published' &&
  (match.homeStarters?.length || 0) >= 11 &&
  (match.awayStarters?.length || 0) >= 11
);

const storyNormalizeCountryValue = (value?: string) => (value || '').trim().toLowerCase();

const storyNormalizeCountryCodeCandidate = (value?: string) => {
  const normalizedValue = storyNormalizeCountryValue(value);
  if (/^[a-z]{2}$/.test(normalizedValue)) return normalizedValue;
  if (normalizedValue.startsWith('gb-')) return 'gb';
  return '';
};

const storyExtractCountryCodeFromFlagUrl = (flagUrl?: string) => {
  const match = (flagUrl || '').match(/\/([a-z]{2})\.(?:svg|png)$/i);
  return match?.[1] || '';
};

const storyFindCountryForPlayer = (player: Player) => {
  const countryCode = storyNormalizeCountryValue(player.countryCode);
  if (countryCode) {
    const byCode = countriesList.find(country => {
      const code = storyNormalizeCountryValue(country.code);
      return code === countryCode || (countryCode.length === 2 && code.startsWith(countryCode));
    });
    if (byCode) return byCode;
  }

  const nationality = storyNormalizeCountryValue(player.nationality);
  if (!nationality) return undefined;
  return countriesList.find(country => storyNormalizeCountryValue(country.name) === nationality);
};

const storyGetPlayerCountryCode = (player: Player) => (
  storyNormalizeCountryCodeCandidate(player.countryCode) ||
  storyNormalizeCountryCodeCandidate(player.flagUrl) ||
  storyNormalizeCountryCodeCandidate(storyFindCountryForPlayer(player)?.code) ||
  storyNormalizeCountryCodeCandidate(storyExtractCountryCodeFromFlagUrl(player.flagUrl))
);

const storyCountryCodeToFlagUrl = (countryCode?: string) => {
  const normalizedCode = storyNormalizeCountryCodeCandidate(countryCode);
  if (!normalizedCode) return '';
  return `https://flagcdn.com/w40/${normalizedCode}.png`;
};

const storyCountryCodeToInlineFlagSrc = (countryCode?: string) => {
  const code = storyNormalizeCountryCodeCandidate(countryCode);
  const flagSvgByCode: Record<string, string> = {
    ar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#75aadb" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><circle cx="15" cy="10" r="1.5" fill="#f6b40e"/></svg>',
    br: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009b3a" d="M0 0h30v20H0z"/><path fill="#ffdf00" d="M15 2 28 10 15 18 2 10z"/><circle cx="15" cy="10" r="4.2" fill="#002776"/></svg>',
    co: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fcd116" d="M0 0h30v10H0z"/><path fill="#003893" d="M0 10h30v5H0z"/><path fill="#ce1126" d="M0 15h30v5H0z"/></svg>',
    fr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#002395" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ed2939" d="M20 0h10v20H20z"/></svg>',
    iq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ce1126" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#000" d="M0 13.33h30V20H0z"/><path fill="#007a3d" d="M12 8.2h6v3.6h-6z"/></svg>',
    it: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009246" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ce2b37" d="M20 0h10v20H20z"/></svg>',
    nl: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ae1c28" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#21468b" d="M0 13.33h30V20H0z"/></svg>',
    pt: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#006600" d="M0 0h12v20H0z"/><path fill="#ff0000" d="M12 0h18v20H12z"/><circle cx="12" cy="10" r="3" fill="#ffcc00"/></svg>',
    es: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#aa151b" d="M0 0h30v5H0zm0 15h30v5H0z"/><path fill="#f1bf00" d="M0 5h30v10H0z"/></svg>',
    uy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><path fill="#0038a8" d="M0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0z"/><path fill="#fff" d="M0 0h12v10H0z"/><circle cx="6" cy="5" r="2.2" fill="#fcd116"/></svg>',
  };
  const svg = flagSvgByCode[code];
  return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';
};

const renderPublishedStoryFlag = (player: Player, width: number, height: number, fontSize: number) => {
  const inlineFlagSrc = storyCountryCodeToInlineFlagSrc(storyGetPlayerCountryCode(player));
  if (inlineFlagSrc) return <img src={inlineFlagSrc} alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;

  const flagUrl = player.flagUrl && player.flagUrl.startsWith('http')
    ? player.flagUrl
    : storyCountryCodeToFlagUrl(player.flagUrl || player.countryCode || storyFindCountryForPlayer(player)?.code);
  if (flagUrl) return <img src={flagUrl} crossOrigin="anonymous" alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;

  return <span style={{ fontSize, color: '#93c5fd', fontWeight: 800, flexShrink: 0 }}>*</span>;
};

export default function Home() {
  // Navigation & Shell States
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Super Admin');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // default collapsed
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
  const [matches, setMatches] = useState<Match[]>([]); // Diisi dari Supabase saat load
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
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
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
        
        // 2. Fetch Players — explicit select club_id dan clubs.id
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
              club_season_id,
              club_seasons (
                id,
                club_id,
                clubs (
                  id,
                  name
                )
              )
            )
          `);
        if (playersError) {
          console.warn('Players fetch error:', playersError);
          throw playersError;
        }

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
              countryCode: p.country_code || '',
              flagUrl: p.country_flag_url || '',
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

        // 5. Fetch Matches via API route
        try {
          const matchRes = await fetch('/api/matches');
          const matchJson = await matchRes.json();
          if (matchJson.success && matchJson.data && matchJson.data.length > 0) {
            setMatches(matchJson.data);
          }
        } catch (matchErr) {
          console.warn('Gagal load matches dari Supabase, pakai data lokal:', matchErr);
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
  // Helper to navigate, close mobile drawer, dan collapse sidebar
  const resetEditors = () => {
    setEditingLineupId(null);
    setEditingResultId(null);
    setEditingRumorId(null);
    setEditingClubId(null);
    setEditingPlayerId(null);
    setEditingCompetitionId(null);
    setEditingScheduleId(null);
  };

  const navigateTo = (menu: ActiveMenu) => {
    setActiveMenu(menu);
    setMobileDrawerOpen(false);
    setSidebarCollapsed(true); // auto-collapse setelah pilih menu
    resetEditors();
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
                      <button
                        key={item.id}
                        type="button"
                        className={`menu-item mobile-drawer-item ${activeMenu === item.id ? 'active' : ''}`}
                        onClick={() => navigateTo(item.id)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
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
                  <button
                    key={item.id}
                    type="button"
                    className={`menu-item ${item.mobileHidden ? 'mobile-hidden' : ''} ${activeMenu === item.id ? 'active' : ''}`}
                    onClick={() => navigateTo(item.id)}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
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
              <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', flexShrink: 0 }} title="Pengaturan" onClick={() => setActiveMenu('settings')}>
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14, margin: '0 auto', cursor: 'pointer' }}
              onClick={() => setActiveMenu('settings')}>
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
                  if (activeMenu === 'schedule') setEditingScheduleId('new');
                  else if (activeMenu === 'lineups') setEditingLineupId('new');
                  else if (activeMenu === 'results') {
                    const readyMatch = matches.find(m => m.lineupStatus === 'Complete' && ['Live', 'Finished'].includes(m.status));
                    if (readyMatch) setEditingResultId(readyMatch.id);
                    else triggerToast('Buat dan lengkapi lineup pada hari H sebelum input hasil.', 'warning');
                  }
                  else if (activeMenu === 'rumors') setEditingRumorId('new');
                  else if (activeMenu === 'clubs') setEditingClubId('new');
                  else if (activeMenu === 'players') setEditingPlayerId('new');
                  else if (activeMenu === 'competitions') setEditingCompetitionId('new');
                  else {
                    setActiveMenu('schedule');
                    setEditingScheduleId('new');
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


              {/* Jadwal Pertandingan Route */}
              {activeMenu === 'schedule' && (
                editingScheduleId ? (
                  <ScheduleEditorView
                    matchId={editingScheduleId}
                    clubs={clubs}
                    competitions={competitions}
                    matches={matches}
                    onClose={() => setEditingScheduleId(null)}
                    onSave={async (newMatch) => {
                      try {
                        const res = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ match: newMatch }) });
                        const result = await res.json();
                        if (!result.success) triggerToast('DB error: ' + result.error, 'warning');
                      } catch (err) { console.warn('Schedule save error:', err); }
                      if (editingScheduleId === 'new') {
                        setMatches(prev => [newMatch, ...prev]);
                        logAction('CREATE_SCHEDULE', 'Jadwal Pertandingan', 'Jadwal baru: ' + newMatch.homeClubName + ' vs ' + newMatch.awayClubName);
                        triggerToast('Jadwal berhasil ditambahkan!');
                      } else {
                        setMatches(prev => prev.map(m => m.id === newMatch.id ? newMatch : m));
                        logAction('UPDATE_SCHEDULE', 'Jadwal Pertandingan', 'Update jadwal: ' + newMatch.homeClubName + ' vs ' + newMatch.awayClubName);
                        triggerToast('Jadwal berhasil diperbarui!');
                      }
                      setEditingScheduleId(null);
                    }}
                    triggerToast={triggerToast}
                  />
                ) : (
                  <ScheduleListView
                    matches={matches}
                    players={players}
                    competitions={competitions}
                    onCreateNew={() => setEditingScheduleId('new')}
                    onEdit={setEditingScheduleId}
                    onDelete={async (id) => {
                      setMatches(prev => prev.filter(m => m.id !== id));
                      logAction('DELETE_SCHEDULE', 'Jadwal Pertandingan', 'Hapus jadwal id: ' + id);
                      triggerToast('Jadwal berhasil dihapus.');
                      try { await fetch('/api/matches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); } catch {}
                    }}
                    onCreateLineup={(id) => { setEditingLineupId(id); setActiveMenu('lineups'); }}
                    onInputResult={(id) => { setEditingResultId(id); setActiveMenu('results'); }}
                    triggerToast={triggerToast}
                    hasPermission={hasPermission}
                  />
                )
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
                    onSave={async (updatedMatch) => {
                      const isPublishedLineup = updatedMatch.publicationStatus === 'Published';
                      try {
                        // Simpan ke Supabase
                        const res = await fetch('/api/matches', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ match: updatedMatch }),
                        });
                        const result = await res.json();
                        if (!result.success) {
                          console.warn('Lineup save warning:', result.error);
                          triggerToast(`Lineup tersimpan lokal, DB error: ${result.error}`, 'warning');
                        }
                      } catch (err) {
                        console.warn('Lineup save to DB failed:', err);
                      }
                      // Update state lokal bagaimana pun hasilnya
                      if (editingLineupId === 'new') {
                        setMatches(prev => [updatedMatch, ...prev]);
                        logAction('CREATE_LINEUP', 'Lineup Pertandingan', `Membuat lineup baru: ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
                        triggerToast(isPublishedLineup ? 'Lineup berhasil dipublish. Share/download story sudah tersedia.' : 'Lineup baru berhasil dibuat!');
                      } else {
                        setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
                        logAction('UPDATE_LINEUP', 'Lineup Pertandingan', `Memperbarui lineup ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
                        triggerToast(isPublishedLineup ? 'Lineup berhasil dipublish. Share/download story sudah tersedia.' : 'Lineup berhasil disimpan!');
                      }
                      setEditingLineupId(isPublishedLineup ? updatedMatch.id : null);
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
                    onDelete={async (id) => {
                      // Hapus dari state dulu agar UI langsung responsif
                      setMatches(prev => prev.filter(m => m.id !== id));
                      logAction('DELETE_LINEUP', 'Lineup Pertandingan', `Menghapus lineup match id: ${id}`);
                      triggerToast('Lineup berhasil dihapus.');
                      // Hapus dari Supabase di background
                      try {
                        const res = await fetch('/api/matches', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id }),
                        });
                        const result = await res.json();
                        if (!result.success) {
                          console.warn('Delete DB warning:', result.error);
                        }
                      } catch (err) {
                        console.warn('Delete DB error:', err);
                      }
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
                    competitions={competitions}
                    onClose={() => setEditingResultId(null)}
                    onSave={async (updatedMatch) => {
                      try {
                        const res = await fetch('/api/matches', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ match: updatedMatch }),
                        });
                        const result = await res.json();
                        if (!result.success) {
                          triggerToast(`Hasil tersimpan lokal, DB error: ${result.error}`, 'warning');
                        }
                      } catch (err) {
                        console.warn('Result save to DB failed:', err);
                        triggerToast('Hasil tersimpan lokal, sinkron DB gagal.', 'warning');
                      }
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
                    competitions={competitions}
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
                          // Relasi gagal â€” klub sudah tersimpan tapi tampilkan warning
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
        <h1 className="page-title">{APP_NAME}</h1>
        <p className="page-description">Ringkasan operasional media olahraga hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Row 1 â€” KPI Cards */}
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

      {/* Row 2 â€” Agenda & Editor task panel */}
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

      {/* Row 3 â€” Quality Warnings & Audit Trail */}
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
// ==========================================
// 1a. SCHEDULE LIST VIEW
// ==========================================
interface ScheduleListProps {
  matches: Match[];
  players: Player[];
  competitions: Competition[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateLineup: (id: string) => void;
  onInputResult: (id: string) => void;
  triggerToast: (msg: string, type?: any) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function ScheduleListView({ matches, players, competitions, onCreateNew, onEdit, onDelete, onCreateLineup, onInputResult, triggerToast, hasPermission }: ScheduleListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComp, setSelectedComp] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewMatch, setPreviewMatch] = useState<Match | null>(null);
  const [isExportingPublishedStory, setIsExportingPublishedStory] = useState(false);

  const filtered = matches.filter(m => {
    const name = (m.homeClubName + ' vs ' + m.awayClubName).toLowerCase();
    const ms = searchTerm.toLowerCase();
    const matchSearch = name.includes(ms) || m.venue.toLowerCase().includes(ms);
    const matchComp   = selectedComp === 'Semua' || m.competition === selectedComp;
    const matchStatus = selectedStatus === 'Semua' || m.status === selectedStatus;
    return matchSearch && matchComp && matchStatus;
  }).sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

  const upcoming = filtered.filter(m => ['Scheduled','Live','Postponed'].includes(m.status));
  const played   = filtered.filter(m => ['Finished','Cancelled'].includes(m.status));
  const scheduledCount = matches.filter(m => m.status === 'Scheduled').length;
  const lineupReadyCount = matches.filter(m => m.lineupStatus === 'Complete').length;
  const resultReadyCount = matches.filter(m => m.lineupStatus === 'Complete' && ['Live','Finished'].includes(m.status)).length;
  const competitionBuckets = competitions
    .map(comp => ({ comp, count: matches.filter(m => m.competition === comp.name).length }))
    .filter(item => item.count > 0 || item.comp.isActive);

  const statusLabel = (s: string) => ({ Scheduled: 'Dijadwalkan', Live: 'Live', Finished: 'Selesai', Postponed: 'Ditunda', Cancelled: 'Dibatalkan' }[s] || s);
  const statusClass = (s: string) => ({ Scheduled: 'badge-info', Live: 'badge-danger', Finished: 'badge-success', Postponed: 'badge-warning', Cancelled: 'badge-draft' }[s] || 'badge-info');
  const lineupClass = (s: string) => s === 'Complete' ? 'badge-success' : s === 'Needs Review' ? 'badge-warning' : 'badge-draft';
  const lineupLabel = (s: string) => s === 'Complete' ? 'Siap' : s === 'Needs Review' ? 'Review' : 'Belum';
  const getPublishedStoryElementId = (matchId: string) => `published-lineup-story-card-${matchId}`;
  const getPublishedStoryFileName = (match: Match) => `Lineup_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`.replace(/[^\w.-]+/g, '_');

  const createPublishedLineupStoryImage = async (match: Match) => {
    const node = document.getElementById(getPublishedStoryElementId(match.id));
    if (!node) throw new Error('Gambar lineup belum siap.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob, fileName: getPublishedStoryFileName(match) };
  };

  const downloadPublishedLineupStory = async (match: Match) => {
    try {
      setIsExportingPublishedStory(true);
      triggerToast('Membuat gambar...');
      const { dataUrl, fileName } = await createPublishedLineupStoryImage(match);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Story berhasil diunduh!');
    } catch (err) {
      console.warn('Published lineup download failed:', err);
      triggerToast('Gagal mengunduh story.', 'error');
    } finally {
      setIsExportingPublishedStory(false);
    }
  };

  const sharePublishedLineupStory = async (match: Match) => {
    try {
      setIsExportingPublishedStory(true);
      triggerToast('Membuat gambar...');
      const { blob, dataUrl, fileName } = await createPublishedLineupStoryImage(match);
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: `${match.homeClubName} vs ${match.awayClubName}`,
        text: 'Lineup Gosball',
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Story siap dibagikan.');
        return;
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.warn('Published lineup share failed:', err);
        triggerToast('Gagal membagikan story.', 'error');
      }
    } finally {
      setIsExportingPublishedStory(false);
    }
  };

  const renderRow = (m: Match) => {
    const isToday = new Date(m.kickoff).toDateString() === new Date().toDateString();
    const canResult = ['Live','Finished'].includes(m.status) && m.lineupStatus === 'Complete';
    const hasLineupData = hasSavedLineupSelection(m);
    const canOpenPublishedLineup = hasPublishedLineupSnapshot(m);
    const canLineup = ['Scheduled','Live'].includes(m.status) || canOpenPublishedLineup;
    const handleLineupAction = () => {
      if (canOpenPublishedLineup) {
        setPreviewMatch(m);
        return;
      }

      if (m.publicationStatus === 'Published' && !hasLineupData) {
        triggerToast('Lineup lama belum punya detail tersimpan. Buka editor untuk simpan ulang lineup.', 'warning');
      }
      onCreateLineup(m.id);
    };
    return (
      <tr key={m.id} style={{ backgroundColor: isToday ? 'var(--primary-50)' : undefined }}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {m.homeLogo && m.homeLogo.startsWith('http')
              ? <img src={m.homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <span style={{ fontSize: 18 }}>{m.homeLogo}</span>}
            <span className="semibold" style={{ fontSize: 13 }}>{m.homeClubName}</span>
            <span className="text-muted" style={{ fontSize: 11 }}>vs</span>
            {m.awayLogo && m.awayLogo.startsWith('http')
              ? <img src={m.awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <span style={{ fontSize: 18 }}>{m.awayLogo}</span>}
            <span className="semibold" style={{ fontSize: 13 }}>{m.awayClubName}</span>
            {isToday && <span style={{ fontSize: 10, background: 'var(--primary-600)', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>HARI INI</span>}
          </div>
          <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{m.venue}</div>
        </td>
        <td style={{ fontSize: 12 }}>{m.competition}</td>
        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <div>{new Date(m.kickoff).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
          <div className="text-muted" style={{ fontSize: 11 }}>{new Date(m.kickoff).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
        </td>
        <td><span className={`badge ${statusClass(m.status)}`}>{statusLabel(m.status)}</span></td>
        <td><span className={`badge ${lineupClass(m.lineupStatus)}`}>{lineupLabel(m.lineupStatus)}</span></td>
        <td style={{ fontSize: 13, fontWeight: 700 }}>
          {m.status === 'Finished' && m.homeScore !== undefined ? `${m.homeScore} - ${m.awayScore}` : <span className="text-muted">-</span>}
        </td>
        <td className="text-right">
          <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canLineup && hasPermission('Lineup', 'create_edit') && (
              <button className="btn btn-sm btn-primary" onClick={handleLineupAction} style={{ fontSize: 11 }}>
                {canOpenPublishedLineup ? 'Lihat Lineup' : hasLineupData ? 'Edit Lineup' : 'Buat Lineup'}
              </button>
            )}
            {['Live','Finished'].includes(m.status) && hasPermission('Match Result', 'create_edit') && (
              <button className="btn btn-sm btn-secondary" disabled={!canResult} title={canResult ? 'Input hasil pertandingan' : 'Lengkapi lineup dulu'} onClick={() => onInputResult(m.id)} style={{ fontSize: 11 }}>Hasil</button>
            )}
            <button className="btn btn-sm btn-secondary" onClick={() => onEdit(m.id)} style={{ fontSize: 11 }}><Edit size={12} /></button>
            {hasPermission('Lineup', 'delete') && (
              confirmDeleteId === m.id ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                  <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={() => { onDelete(m.id); setConfirmDeleteId(null); }}>Ya</button>
                  <button className="btn btn-sm btn-secondary" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(null)}>Batal</button>
                </span>
              ) : (
                <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(m.id)}><Trash2 size={12} /></button>
              )
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderTable = (rows: Match[], title: string) => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>
        {title} ({rows.length})
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pertandingan</th>
              <th>Kompetisi</th>
              <th>Kickoff</th>
              <th>Status</th>
              <th>Lineup</th>
              <th>Skor</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Jadwal Pertandingan</span></div>
          <h1 className="page-title">Jadwal Pertandingan</h1>
          <p className="page-description">Kelola jadwal semua kompetisi sebagai pintu awal flow: jadwal, lineup hari H, lalu hasil HT/FT.</p>
        </div>
        {hasPermission('Lineup', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}><Plus size={16} /> Tambah Jadwal</button>
        )}
      </div>

      <div className="schedule-flow-grid">
        <div className="schedule-flow-card">
          <Calendar size={18} />
          <div>
            <span>Jadwal dibuat</span>
            <strong>{scheduledCount}</strong>
          </div>
        </div>
        <div className="schedule-flow-card">
          <FileText size={18} />
          <div>
            <span>Lineup siap</span>
            <strong>{lineupReadyCount}</strong>
          </div>
        </div>
        <div className="schedule-flow-card">
          <Trophy size={18} />
          <div>
            <span>Siap hasil HT/FT</span>
            <strong>{resultReadyCount}</strong>
          </div>
        </div>
      </div>

      <div className="competition-schedule-strip">
        {competitionBuckets.map(({ comp, count }) => (
          <button
            key={comp.id}
            type="button"
            className={`competition-schedule-pill ${selectedComp === comp.name ? 'active' : ''}`}
            onClick={() => setSelectedComp(selectedComp === comp.name ? 'Semua' : comp.name)}
          >
            <span>{comp.shortName || comp.name}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ maxWidth: 260, flex: 1 }}>
          <Search size={14} className="search-icon" />
          <input type="text" className="form-input" placeholder="Cari klub atau stadion..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-select" style={{ maxWidth: 220 }} value={selectedComp} onChange={e => setSelectedComp(e.target.value)}>
          <option value="Semua">Semua Kompetisi</option>
          {competitions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
          <option value="Semua">Semua Status</option>
          <option value="Scheduled">Dijadwalkan</option>
          <option value="Live">Live</option>
          <option value="Finished">Selesai</option>
          <option value="Postponed">Ditunda</option>
          <option value="Cancelled">Dibatalkan</option>
        </select>
        {(searchTerm || selectedComp !== 'Semua' || selectedStatus !== 'Semua') && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setSelectedComp('Semua'); setSelectedStatus('Semua'); }}>Reset</button>
        )}
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{filtered.length} pertandingan</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Calendar size={36} color="var(--neutral-400)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Belum ada jadwal</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Tambahkan jadwal pertandingan untuk semua kompetisi.</p>
          {hasPermission('Lineup', 'create_edit') && (
            <button className="btn btn-sm btn-primary" onClick={onCreateNew}>Tambah Jadwal</button>
          )}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && renderTable(upcoming, 'Mendatang')}
          {played.length > 0 && renderTable(played, 'Sudah Berlangsung')}
        </>
      )}

      {previewMatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
          onClick={() => setPreviewMatch(null)}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxHeight: '95vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-md btn-primary" onClick={() => sharePublishedLineupStory(previewMatch)} disabled={isExportingPublishedStory}>
                <Share2 size={14} /> Bagikan Story
              </button>
              <button className="btn btn-md btn-secondary" onClick={() => downloadPublishedLineupStory(previewMatch)} disabled={isExportingPublishedStory}>
                <Download size={14} /> Unduh PNG
              </button>
              <button className="btn btn-md btn-secondary" onClick={() => setPreviewMatch(null)}>
                <X size={14} /> Tutup
              </button>
            </div>
            <PublishedLineupStoryCard
              match={previewMatch}
              players={players}
              competitions={competitions}
              elementId={getPublishedStoryElementId(previewMatch.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PublishedLineupStoryCard({ match, players, competitions, elementId }: {
  match: Match;
  players: Player[];
  competitions: Competition[];
  elementId: string;
}) {
  const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
  const homeSquad = players.filter(p => p.clubId === match.homeClubId);
  const awaySquad = players.filter(p => p.clubId === match.awayClubId);
  const homeStarterIds = match.homeStarters || [];
  const awayStarterIds = match.awayStarters || [];
  const homeSubIds = match.homeSubs || [];
  const awaySubIds = match.awaySubs || [];

  const getSelectedPlayers = (squad: Player[], ids: string[]) => squad
    .filter(player => ids.includes(player.id))
    .sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));

  const getForeignPool = (squad: Player[], starterIds: string[], subIds: string[]) => squad
    .filter(player => !starterIds.includes(player.id) && !subIds.includes(player.id) && player.nationality !== 'Indonesia');

  const renderPlayerLine = (player: Player, captainId: string | undefined, muted = false) => {
    const isForeign = player.nationality !== 'Indonesia';
    const isCaptain = player.id === captainId;
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: muted ? 2 : 3 }}>
        <span style={{ fontSize: muted ? 7 : 8, color: muted ? '#555' : '#c8a84b', fontWeight: 700, minWidth: 22, fontVariantNumeric: 'tabular-nums' }}>
          {player.shirtNumber}
        </span>
        {isForeign ? renderPublishedStoryFlag(player, muted ? 10 : 12, muted ? 7 : 8, muted ? 8 : 9) : null}
        <span style={{ fontSize: muted ? 8 : 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: muted ? (isForeign ? '#6b7280' : '#6b7280') : isCaptain ? '#c8a84b' : isForeign ? '#93c5fd' : '#e2e8f0',
          fontWeight: isCaptain ? 700 : 400 }}>
          {player.displayName}{isCaptain ? ' (C)' : ''}
        </span>
      </div>
    );
  };

  const renderTeamColumn = (side: 'home' | 'away') => {
    const isHome = side === 'home';
    const squad = isHome ? homeSquad : awaySquad;
    const starterIds = isHome ? homeStarterIds : awayStarterIds;
    const subIds = isHome ? homeSubIds : awaySubIds;
    const starters = getSelectedPlayers(squad, starterIds);
    const subs = getSelectedPlayers(squad, subIds);
    const nonDsp = getForeignPool(squad, starterIds, subIds);
    const code = isHome ? match.homeClubName.slice(0, 3).toUpperCase() : match.awayClubName.slice(0, 3).toUpperCase();
    const captainId = isHome ? match.homeCaptain : match.awayCaptain;

    return (
      <div style={{ flex: 1, padding: isHome ? '10px 10px 10px 16px' : '10px 16px 10px 10px', borderRight: isHome ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
        <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5,
          textTransform: 'uppercase', marginBottom: 7, paddingBottom: 4,
          borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
          {code} - STARTING
        </div>
        {starters.map(player => renderPlayerLine(player, captainId))}

        {subs.length > 0 && (
          <>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase',
              margin: '7px 0 4px', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              CADANGAN
            </div>
            {subs.map(player => renderPlayerLine(player, captainId, true))}
          </>
        )}

        {nonDsp.length > 0 && (
          <>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#333', letterSpacing: 1, textTransform: 'uppercase',
              margin: '6px 0 3px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              NON-DSP
            </div>
            {nonDsp.map(player => (
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                <span style={{ fontSize: 7, color: '#333', fontWeight: 600, minWidth: 22 }}>{player.shirtNumber}</span>
                {renderPublishedStoryFlag(player, 10, 7, 8)}
                <span style={{ fontSize: 8, color: '#3f4855', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.displayName}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const comp = competitions.find(c => c.name === match.competition);
  return (
    <div id={elementId} style={{
      width: 360, minHeight: 640,
      background: '#0a0a0a',
      color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 30px 60px rgba(0,0,0,0.9)', position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
      <div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {comp?.logoUrl && comp.logoUrl.startsWith('http')
          ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, background: 'white', borderRadius: 4, padding: 2 }} />
          : <div style={{ width: 30, height: 30, background: 'rgba(200,168,75,0.12)', borderRadius: 4, border: '1px solid rgba(200,168,75,0.3)' }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#c8a84b', letterSpacing: 2, textTransform: 'uppercase' }}>{match.competition}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'white', letterSpacing: 0.3, marginTop: 1 }}>SUSUNAN PEMAIN</div>
        </div>
        <img src={APP_LOGO_SRC} alt={APP_NAME} style={{ width: 44, height: 32, objectFit: 'contain' }} />
      </div>

      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {match.homeLogo && match.homeLogo.startsWith('http')
            ? <img src={match.homeLogo} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
            : <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{match.homeLogo || 'H'}</div>}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{match.homeClubName}</div>
            <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{match.homeFormation || '4-3-3'}</div>
          </div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: 2, padding: '0 10px' }}>VS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
          {match.awayLogo && match.awayLogo.startsWith('http')
            ? <img src={match.awayLogo} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
            : <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{match.awayLogo || 'A'}</div>}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{match.awayClubName}</div>
            <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{match.awayFormation || '4-2-3-1'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {renderTeamColumn('home')}
        {renderTeamColumn('away')}
      </div>

      <div style={{ padding: '8px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 7, color: '#3a3a3a', marginTop: 1 }}>{match.venue}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#c8a84b', letterSpacing: 1 }}>GOSBALL</div>
          <div style={{ fontSize: 7, color: '#444', marginTop: 1 }}>{APP_HANDLE}</div>
        </div>
      </div>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
    </div>
  );
}

// ==========================================
// 1b. SCHEDULE EDITOR VIEW
// ==========================================
interface ScheduleEditorProps {
  matchId: string;
  clubs: Club[];
  competitions: Competition[];
  matches: Match[];
  onClose: () => void;
  onSave: (match: Match) => void;
  triggerToast: (msg: string, type?: any) => void;
}

function ScheduleEditorView({ matchId, clubs, competitions, matches, onClose, onSave, triggerToast }: ScheduleEditorProps) {
  const isNew = matchId === 'new';
  const existing = matches.find(m => m.id === matchId);
  const firstComp = competitions.find(c => c.isActive) || competitions[0];

  const [competition, setCompetition] = useState(existing?.competition || firstComp?.name || '');
  const [homeClubId, setHomeClubId]   = useState(existing?.homeClubId || clubs[0]?.id || '');
  const [awayClubId, setAwayClubId]   = useState(existing?.awayClubId || (clubs[1]?.id || ''));
  const [kickoff, setKickoff]         = useState(existing?.kickoff ? existing.kickoff.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [venue, setVenue]             = useState(existing?.venue || '');
  const [status, setStatus]           = useState<Match['status']>(existing?.status || 'Scheduled');
  const selectedCompetition = competitions.find(c => c.name === competition);
  const eligibleClubs = selectedCompetition ? clubs.filter(c => c.competitionIds?.includes(selectedCompetition.id)) : clubs;
  const clubOptions = eligibleClubs.length >= 2 ? eligibleClubs : clubs;

  useEffect(() => {
    if (!existing?.venue) {
      const hc = clubs.find(c => c.id === homeClubId);
      if (hc?.stadium) setVenue(hc.stadium);
    }
  }, [homeClubId]);

  const handleSave = () => {
    if (!homeClubId || !awayClubId) { triggerToast('Pilih kedua tim.', 'error'); return; }
    if (homeClubId === awayClubId) { triggerToast('Tim home dan away tidak boleh sama.', 'error'); return; }
    if (!kickoff) { triggerToast('Isi tanggal kickoff.', 'error'); return; }
    const hc = clubs.find(c => c.id === homeClubId);
    const ac = clubs.find(c => c.id === awayClubId);
    const comp = competitions.find(c => c.name === competition);
    const match: Match = {
      ...(existing || {}),
      id: existing?.id || ('match-' + Date.now()),
      homeClubId, homeClubName: hc?.name || '', homeLogo: hc?.logoUrl || '',
      awayClubId,  awayClubName: ac?.name || '', awayLogo: ac?.logoUrl || '',
      competition, season: comp?.season || '',
      kickoff: new Date(kickoff).toISOString(), venue, status,
      homeScore: existing?.homeScore, awayScore: existing?.awayScore,
      halfTimeHomeScore: existing?.halfTimeHomeScore, halfTimeAwayScore: existing?.halfTimeAwayScore,
      lineupStatus: existing?.lineupStatus || 'Draft',
      publicationStatus: existing?.publicationStatus || 'Draft',
      editor: 'Admin', lastUpdated: 'Baru saja',
    };
    onSave(match);
  };

  const homeClub = clubs.find(c => c.id === homeClubId);
  const awayClub = clubs.find(c => c.id === awayClubId);
  const handleCompetitionChange = (nextName: string) => {
    setCompetition(nextName);
    const nextComp = competitions.find(c => c.name === nextName);
    const nextEligible = nextComp ? clubs.filter(c => c.competitionIds?.includes(nextComp.id)) : clubs;
    const nextOptions = nextEligible.length >= 2 ? nextEligible : clubs;
    if (nextOptions.length > 0) {
      const nextHome = nextOptions[0];
      const nextAway = nextOptions.find(c => c.id !== nextHome.id);
      setHomeClubId(nextHome.id);
      if (nextAway) setAwayClubId(nextAway.id);
      if (nextHome.stadium) setVenue(nextHome.stadium);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--neutral-200)', paddingBottom: 14 }}>
        <button className="btn btn-sm btn-secondary" onClick={onClose}><ArrowLeft size={16} /> Kembali</button>
        <div>
          <div className="breadcrumb"><span>Jadwal</span> <ChevronRight size={10} /> <span>{isNew ? 'Tambah Jadwal' : 'Edit Jadwal'}</span></div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{isNew ? 'Tambah Jadwal Baru' : `Edit: ${existing?.homeClubName} vs ${existing?.awayClubName}`}</h2>
        </div>
        <button className="btn btn-md btn-primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>
          <CheckCircle size={14} /> {isNew ? 'Simpan Jadwal' : 'Update Jadwal'}
        </button>
      </div>

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Kompetisi <span className="required">*</span></label>
          <select className="form-select" value={competition} onChange={e => handleCompetitionChange(e.target.value)}>
            {competitions.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} ({c.season})</option>)}
            {competitions.filter(c => !c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} (nonaktif)</option>)}
          </select>
          <span className="form-helper">
            {eligibleClubs.length >= 2 ? `${eligibleClubs.length} klub peserta tersedia untuk kompetisi ini.` : 'Belum ada relasi peserta, semua klub ditampilkan.'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Tim Home <span className="required">*</span></label>
            <select className="form-select" value={homeClubId} onChange={e => setHomeClubId(e.target.value)}>
              {clubOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tim Away <span className="required">*</span></label>
            <select className="form-select" value={awayClubId} onChange={e => setAwayClubId(e.target.value)}>
              {clubOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {homeClubId && awayClubId && homeClubId !== awayClubId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '14px 0',
            background: 'var(--neutral-50)', borderRadius: 8, border: '1px solid var(--neutral-200)' }}>
            <div style={{ textAlign: 'center' }}>
              {homeClub?.logoUrl && homeClub.logoUrl.startsWith('http')
                ? <img src={homeClub.logoUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                : <span style={{ fontSize: 32 }}>{homeClub?.logoUrl || 'H'}</span>}
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{homeClub?.shortName}</div>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--neutral-400)' }}>VS</span>
            <div style={{ textAlign: 'center' }}>
              {awayClub?.logoUrl && awayClub.logoUrl.startsWith('http')
                ? <img src={awayClub.logoUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                : <span style={{ fontSize: 32 }}>{awayClub?.logoUrl || 'A'}</span>}
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{awayClub?.shortName}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Tanggal & Waktu Kickoff <span className="required">*</span></label>
            <input type="datetime-local" className="form-input" value={kickoff} onChange={e => setKickoff(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Status Pertandingan</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Match['status'])}>
              <option value="Scheduled">Dijadwalkan</option>
              <option value="Live">Live</option>
              <option value="Finished">Selesai</option>
              <option value="Postponed">Ditunda</option>
              <option value="Cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Venue / Stadion <span style={{ fontSize: 11, color: 'var(--neutral-400)', fontWeight: 400 }}>(auto dari home club)</span></label>
          <input type="text" className="form-input" placeholder="Nama stadion..." value={venue} onChange={e => setVenue(e.target.value)} />
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
  competitions: Competition[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function LineupsListView({ matches, competitions, onCreateNew, onEdit, onDelete, hasPermission }: LineupsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComp, setSelectedComp] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredMatches = matches.filter(match => {
    const matchName = `${match.homeClubName} vs ${match.awayClubName}`.toLowerCase();
    const matchesSearch = matchName.includes(searchTerm.toLowerCase()) || match.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComp = selectedComp === 'Semua' || match.competition === selectedComp;
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
          <p className="page-description">Kelola susunan pemain, formasi, dan cadangan untuk setiap pertandingan.</p>
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
          <div className="search-input-wrapper" style={{ maxWidth: 280 }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Cari klub atau stadion..." className="form-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: 220 }} value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
            <option value="Semua">Semua Kompetisi</option>
            {competitions.filter(c => c.isActive).map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            {competitions.filter(c => !c.isActive).map(c => (
              <option key={c.id} value={c.name}>{c.name} (nonaktif)</option>
            ))}
          </select>
        </div>
        {(searchTerm || selectedComp !== 'Semua') && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setSelectedComp('Semua'); }}>
            Reset Filter
          </button>
        )}
      </div>

      {/* Data Table */}
      {filteredMatches.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Belum ada lineup</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Buat lineup baru atau ubah filter.</p>
          {hasPermission('Lineup', 'create_edit') && (
            <button className="btn btn-sm btn-primary" onClick={onCreateNew}>Buat Lineup</button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertandingan</th>
                <th>Kompetisi</th>
                <th>Kickoff</th>
                <th>Status</th>
                <th>Publikasi</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(match => (
                <tr key={match.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {match.homeLogo && match.homeLogo.startsWith('http')
                        ? <img src={match.homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 18 }}>{match.homeLogo}</span>}
                      <span className="semibold" style={{ fontSize: 13 }}>{match.homeClubName}</span>
                      <span className="text-muted" style={{ fontSize: 11 }}>vs</span>
                      {match.awayLogo && match.awayLogo.startsWith('http')
                        ? <img src={match.awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 18 }}>{match.awayLogo}</span>}
                      <span className="semibold" style={{ fontSize: 13 }}>{match.awayClubName}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{match.venue}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{match.competition}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(match.kickoff).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
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
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button className="btn btn-sm btn-primary" onClick={() => onEdit(match.id)}>
                        <Edit size={13} /> Edit
                      </button>
                      {(
                        confirmDeleteId === match.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                            <button className="btn btn-sm btn-danger" onClick={() => { onDelete(match.id); setConfirmDeleteId(null); }}>Ya</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                          </span>
                        ) : (
                          <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(match.id)}>
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
      )}
    </div>
  );
}

// ==========================================
// 3. LINEUP EDITOR VIEW â€” 1 TAB LAYOUT
// ==========================================
interface AsingEntry { id: string; name: string; no: number; pos: string; }

interface LineupEditorProps {
  matchId: string;
  clubs: Club[];
  players: Player[];
  matches: Match[];
  competitions: Competition[];
  onClose: () => void;
  onSave: (match: Match) => void | Promise<void>;
  triggerToast: (msg: string, type?: any) => void;
  logAction: (action: string, module: string, details: string) => void;
}

function LineupEditorView({ matchId, clubs, players, matches, competitions, onClose, onSave, triggerToast }: LineupEditorProps) {
  const isNew = matchId === 'new';
  const existingMatch = matches.find(m => m.id === matchId);
  const matchInfoLocked = Boolean(existingMatch);
  const firstComp = competitions.find(c => c.isActive) || competitions[0];

  const [selectedCompetitionName, setSelectedCompetitionName] = useState(existingMatch?.competition || firstComp?.name || '');
  const [selectedHomeClub, setSelectedHomeClub] = useState(existingMatch?.homeClubId || clubs[0]?.id || '');
  const [selectedAwayClub, setSelectedAwayClub] = useState(existingMatch?.awayClubId || clubs[1]?.id || '');
  const [homeFormation, setHomeFormation] = useState(existingMatch?.homeFormation || '4-3-3');
  const [awayFormation, setAwayFormation] = useState(existingMatch?.awayFormation || '4-2-3-1');
  const [kickoffTime, setKickoffTime] = useState(existingMatch?.kickoff || new Date().toISOString());
  const [venueName, setVenueName] = useState(existingMatch?.venue || '');
  const FORMATIONS = ['4-3-3','4-2-3-1','3-5-2','4-4-2','5-3-2','3-4-3','4-1-4-1'];

  // Auto-fill venue dari home club
  useEffect(() => {
    if (!existingMatch?.venue) {
      const hc = clubs.find(c => c.id === selectedHomeClub);
      if (hc?.stadium) setVenueName(hc.stadium);
    }
  }, [selectedHomeClub]);

  const homeSquad = players.filter(p => p.clubId === selectedHomeClub);
  const awaySquad = players.filter(p => p.clubId === selectedAwayClub);

  const [homeStarters, setHomeStarters] = useState<string[]>(existingMatch?.homeStarters || []);
  const [homeSubs, setHomeSubs] = useState<string[]>(existingMatch?.homeSubs || []);
  const [awayStarters, setAwayStarters] = useState<string[]>(existingMatch?.awayStarters || []);
  const [awaySubs, setAwaySubs] = useState<string[]>(existingMatch?.awaySubs || []);
  const [homeCaptain, setHomeCaptain] = useState<string>(existingMatch?.homeCaptain || '');
  const [awayCaptain, setAwayCaptain] = useState<string>(existingMatch?.awayCaptain || '');
  const [homeAsing, setHomeAsing] = useState<AsingEntry[]>(existingMatch?.homeAsing || []);
  const [awayAsing, setAwayAsing] = useState<AsingEntry[]>(existingMatch?.awayAsing || []);
  const [homeAsingInput, setHomeAsingInput] = useState({ name: '', no: '', pos: 'FW' });
  const [awayAsingInput, setAwayAsingInput] = useState({ name: '', no: '', pos: 'FW' });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExportingStory, setIsExportingStory] = useState(false);
  const isPublishedLineup = existingMatch?.publicationStatus === 'Published';

  // =================================================================
  // REGULASI PEMAIN ASING - LIGA INDONESIA
  // - DSP Liga      : maks 11 asing boleh didaftarkan di liga
  // - Dibawa match  : dari 11, maks 9 yang boleh dibawa per pertandingan
  // - Starting XI   : dari 9, maks 7 yang boleh main
  // - Cadangan      : sisa dari 9 dikurangi yang main di starting
  //   Contoh:
  //     5 starting asing -> 4 cadangan asing (5+4=9 dibawa)
  //     6 starting asing -> 3 cadangan asing (6+3=9 dibawa)
  //     7 starting asing -> 2 cadangan asing (7+2=9 dibawa)
  // =================================================================
  const MAX_ASING_DSP     = 11; // maks asing terdaftar di DSP liga
  const MAX_ASING_DIBAWA  =  9; // maks asing dibawa per pertandingan
  const MAX_ASING_MAIN    =  7; // maks asing di starting XI
  const MAX_SUBS          = 15; // maks total cadangan

  const homeValid = homeStarters.length === 11;
  const awayValid = awayStarters.length === 11;
  const homeHasGK = homeSquad.some(p => homeStarters.includes(p.id) && p.position === 'Goalkeeper');
  const awayHasGK = awaySquad.some(p => awayStarters.includes(p.id) && p.position === 'Goalkeeper');
  const posLabel: Record<string, string> = { Goalkeeper: 'GK', Defender: 'DF', Midfielder: 'MF', Forward: 'FW' };

  // Klik dari pool -> masuk slot yang tepat otomatis
  const pickPlayer = (
    id: string,
    squad: Player[],
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>
  ) => {
    const player = squad.find(p => p.id === id);
    if (!player) return;
    const isForeign = player.nationality !== 'Indonesia';

    if (isForeign) {
      const fSt    = squad.filter(p => starters.includes(p.id) && p.nationality !== 'Indonesia').length;
      const fSub   = squad.filter(p => subs.includes(p.id)     && p.nationality !== 'Indonesia').length;
      const fDibawa = fSt + fSub; // total asing dibawa (starting + cadangan)

      // Cek apakah total asing yang dibawa sudah mencapai 9
      if (fDibawa >= MAX_ASING_DIBAWA) {
        // Semua jatah 9 asing sudah terpakai -> tidak bisa masuk starting/cadangan
        // Tampilkan info tapi jangan masuk ke mana pun (pemain ini hanya di pool DSP liga)
        triggerToast(
          player.displayName + ' tidak bisa dibawa - kuota 9 asing per pertandingan sudah penuh.',
          'warning'
        );
        return;
      }

      // Masih ada slot asing dibawa (fDibawa < 9)
      if (starters.length < 11 && fSt < MAX_ASING_MAIN) {
        // Slot starter tersedia dan asing starter belum 7 -> masuk starting
        setStarters(p => [...p, id]);
      } else if (starters.length < 11 && fSt >= MAX_ASING_MAIN) {
        // Starter tersedia tapi asing di starting sudah 7 -> otomatis cadangan
        if (subs.length < MAX_SUBS) {
          setSubs(p => [...p, id]);
          triggerToast(player.displayName + ' masuk cadangan - kuota 7 asing starting sudah penuh', 'warning');
        } else {
          triggerToast('Cadangan penuh.', 'warning');
        }
      } else if (starters.length >= 11) {
        // Starting sudah 11 -> cadangan
        if (subs.length < MAX_SUBS) {
          setSubs(p => [...p, id]);
        } else {
          triggerToast('Cadangan penuh.', 'warning');
        }
      }

    } else {
      // Pemain lokal - bebas, tidak ada batasan
      if (starters.length < 11) {
        setStarters(p => [...p, id]);
      } else if (subs.length < MAX_SUBS) {
        setSubs(p => [...p, id]);
      } else {
        triggerToast('Cadangan penuh.', 'warning');
      }
    }
  };

  // Klik di starting/cadangan -> kembalikan ke pool
  const returnToPool = (
    id: string,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (starters.includes(id)) setStarters(p => p.filter(x => x !== id));
    else if (subs.includes(id)) setSubs(p => p.filter(x => x !== id));
  };


  const addAsing = (side: 'home' | 'away') => {
    const inp = side === 'home' ? homeAsingInput : awayAsingInput;
    if (!inp.name.trim()) { triggerToast('Nama wajib diisi.', 'error'); return; }
    const entry: AsingEntry = { id: 'asing-' + Date.now(), name: inp.name.trim(), no: Number(inp.no) || 0, pos: inp.pos };
    if (side === 'home') { setHomeAsing(p => [...p, entry]); setHomeAsingInput({ name: '', no: '', pos: 'FW' }); }
    else { setAwayAsing(p => [...p, entry]); setAwayAsingInput({ name: '', no: '', pos: 'FW' }); }
  };

  const handleSave = (publish = false) => {
    const homeClub = clubs.find(c => c.id === selectedHomeClub);
    const awayClub = clubs.find(c => c.id === selectedAwayClub);
    const competitionName = existingMatch?.competition || selectedCompetitionName;
    const kickoff = existingMatch?.kickoff || kickoffTime;
    const status: Match['lineupStatus'] = homeValid && awayValid && homeHasGK && awayHasGK ? 'Complete' : 'Needs Review';
    const updatedMatch: Match = {
      ...(existingMatch || {}),
      id: existingMatch?.id || 'match-' + Date.now(),
      homeClubId: existingMatch?.homeClubId || selectedHomeClub, homeClubName: existingMatch?.homeClubName || homeClub?.name || '',
      homeLogo: existingMatch?.homeLogo || homeClub?.logoUrl || '',
      awayClubId: existingMatch?.awayClubId || selectedAwayClub, awayClubName: existingMatch?.awayClubName || awayClub?.name || '',
      awayLogo: existingMatch?.awayLogo || awayClub?.logoUrl || '',
      competition: competitionName,
      season: existingMatch?.season || competitions.find(c => c.name === competitionName)?.season || '',
      kickoff, venue: venueName,
      status: existingMatch?.status || 'Scheduled',
      lineupStatus: status,
      publicationStatus: publish ? 'Published' : (existingMatch?.publicationStatus || 'Draft'),
      homeFormation,
      awayFormation,
      homeStarters,
      homeSubs,
      awayStarters,
      awaySubs,
      homeCaptain,
      awayCaptain,
      homeAsing,
      awayAsing,
      editor: 'Admin', lastUpdated: 'Baru saja',
    };
    onSave(updatedMatch);
  };

  const homeClub = clubs.find(c => c.id === selectedHomeClub);
  const awayClub = clubs.find(c => c.id === selectedAwayClub);
  const storyFileName = 'Lineup_' + (homeClub?.shortName || 'HOME') + '_vs_' + (awayClub?.shortName || 'AWAY') + '.png';

  const createLineupStoryImage = async () => {
    const node = document.getElementById('lineup-story-card');
    if (!node) throw new Error('Preview lineup belum siap.');

    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob, fileName: storyFileName };
  };

  const downloadLineupStory = async () => {
    if (!isPublishedLineup) {
      triggerToast('Publish lineup dulu untuk membuka download story.', 'warning');
      return;
    }

    try {
      setIsExportingStory(true);
      triggerToast('Membuat gambar...');
      const { dataUrl, fileName } = await createLineupStoryImage();
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Story berhasil diunduh!');
    } catch (err) {
      console.warn('Lineup story download failed:', err);
      triggerToast('Gagal mengunduh story.', 'error');
    } finally {
      setIsExportingStory(false);
    }
  };

  const shareLineupStory = async () => {
    if (!isPublishedLineup) {
      triggerToast('Publish lineup dulu untuk membuka share story.', 'warning');
      return;
    }

    try {
      setIsExportingStory(true);
      triggerToast('Membuat gambar...');
      const { blob, dataUrl, fileName } = await createLineupStoryImage();
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      const shareData: ShareData = {
        files: [file],
        title: `${homeClub?.shortName || 'HOME'} vs ${awayClub?.shortName || 'AWAY'}`,
        text: 'Lineup Gosball',
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Story siap dibagikan.');
        return;
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.warn('Lineup story share failed:', err);
        triggerToast('Gagal membagikan story.', 'error');
      }
    } finally {
      setIsExportingStory(false);
    }
  };

  const normalizeCountryValue = (value?: string) => (value || '').trim().toLowerCase();

  const findCountryForPlayer = (player: Player) => {
    const countryCode = normalizeCountryValue(player.countryCode);
    if (countryCode) {
      const byCode = countriesList.find(country => {
        const code = normalizeCountryValue(country.code);
        return code === countryCode || (countryCode.length === 2 && code.startsWith(countryCode));
      });
      if (byCode) return byCode;
    }

    const nationality = normalizeCountryValue(player.nationality);
    if (!nationality) return undefined;
    return countriesList.find(country => normalizeCountryValue(country.name) === nationality);
  };

  const extractCountryCodeFromFlagUrl = (flagUrl?: string) => {
    const match = (flagUrl || '').match(/\/([a-z]{2})\.(?:svg|png)$/i);
    return match?.[1] || '';
  };

  const normalizeCountryCodeCandidate = (value?: string) => {
    const normalizedValue = normalizeCountryValue(value);
    if (/^[a-z]{2}$/.test(normalizedValue)) return normalizedValue;
    if (normalizedValue.startsWith('gb-')) return 'gb';
    return '';
  };

  const countryCodeToFlagUrl = (countryCode?: string) => {
    const normalizedCode = normalizeCountryCodeCandidate(countryCode);
    if (!normalizedCode) return '';
    return `https://flagcdn.com/w40/${normalizedCode}.png`;
  };

  const countryCodeToFlagEmoji = (countryCode?: string) => {
    const normalizedCode = normalizeCountryValue(countryCode).slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCode)) return '';
    return String.fromCodePoint(...normalizedCode.split('').map(char => 127397 + char.charCodeAt(0)));
  };

  const getPlayerCountryCode = (player: Player) => (
    normalizeCountryCodeCandidate(player.countryCode) ||
    normalizeCountryCodeCandidate(player.flagUrl) ||
    normalizeCountryCodeCandidate(findCountryForPlayer(player)?.code) ||
    normalizeCountryCodeCandidate(extractCountryCodeFromFlagUrl(player.flagUrl))
  );

  const countryCodeToInlineFlagSrc = (countryCode?: string) => {
    const code = normalizeCountryCodeCandidate(countryCode);
    const flagSvgByCode: Record<string, string> = {
      ar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#75aadb" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><circle cx="15" cy="10" r="1.5" fill="#f6b40e"/></svg>',
      br: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009b3a" d="M0 0h30v20H0z"/><path fill="#ffdf00" d="M15 2 28 10 15 18 2 10z"/><circle cx="15" cy="10" r="4.2" fill="#002776"/></svg>',
      co: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fcd116" d="M0 0h30v10H0z"/><path fill="#003893" d="M0 10h30v5H0z"/><path fill="#ce1126" d="M0 15h30v5H0z"/></svg>',
      fr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#002395" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ed2939" d="M20 0h10v20H20z"/></svg>',
      iq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ce1126" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#000" d="M0 13.33h30V20H0z"/><path fill="#007a3d" d="M12 8.2h6v3.6h-6z"/></svg>',
      it: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009246" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ce2b37" d="M20 0h10v20H20z"/></svg>',
      nl: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ae1c28" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#21468b" d="M0 13.33h30V20H0z"/></svg>',
      pt: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#006600" d="M0 0h12v20H0z"/><path fill="#ff0000" d="M12 0h18v20H12z"/><circle cx="12" cy="10" r="3" fill="#ffcc00"/></svg>',
      es: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#aa151b" d="M0 0h30v5H0zm0 15h30v5H0z"/><path fill="#f1bf00" d="M0 5h30v10H0z"/></svg>',
      uy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><path fill="#0038a8" d="M0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0z"/><path fill="#fff" d="M0 0h12v10H0z"/><circle cx="6" cy="5" r="2.2" fill="#fcd116"/></svg>',
    };
    const svg = flagSvgByCode[code];
    return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';
  };

  const resolvePlayerFlagUrl = (player: Player) => {
    if (player.flagUrl && player.flagUrl.startsWith('http')) return player.flagUrl;
    return (
      countryCodeToFlagUrl(player.flagUrl) ||
      countryCodeToFlagUrl(player.countryCode) ||
      countryCodeToFlagUrl(findCountryForPlayer(player)?.code) ||
      findCountryForPlayer(player)?.flagUrl ||
      ''
    );
  };

  const resolvePlayerFlagEmoji = (player: Player) => {
    if (player.flagUrl && !player.flagUrl.startsWith('http') && player.flagUrl.length <= 4 && !normalizeCountryCodeCandidate(player.flagUrl)) return player.flagUrl;
    return countryCodeToFlagEmoji(player.countryCode || findCountryForPlayer(player)?.code || extractCountryCodeFromFlagUrl(player.flagUrl) || normalizeCountryCodeCandidate(player.flagUrl));
  };

  const renderFlag = (player: Player) => {
    const flagUrl = resolvePlayerFlagUrl(player);
    const flagEmoji = resolvePlayerFlagEmoji(player);
    if (flagUrl)
      return <img src={flagUrl} alt="" style={{ width: 14, height: 10, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;
    if (flagEmoji)
      return <span style={{ fontSize: 12, lineHeight: 1, flexShrink: 0 }}>{flagEmoji}</span>;
    return null;
  };

  const renderStoryFlag = (player: Player, width: number, height: number, fontSize: number) => {
    const inlineFlagSrc = countryCodeToInlineFlagSrc(getPlayerCountryCode(player));
    if (inlineFlagSrc) {
      return <img src={inlineFlagSrc} alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;
    }

    const flagUrl = resolvePlayerFlagUrl(player);
    if (flagUrl) {
      return <img src={flagUrl} crossOrigin="anonymous" alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;
    }

    return <span style={{ fontSize, color: '#93c5fd', fontWeight: 800, flexShrink: 0 }}>*</span>;
  };


  // POOL ITEM: klik = masuk slot, pakai className pool-item-btn (CSS handles sizing)

  // POOL ITEM: tampilan serupa dengan Selected Item agar konsisten
  const renderPoolItem = (
    player: Player,
    squad: Player[],
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>
  ) => {
    const isForeign = player.nationality !== 'Indonesia';
    const isUnavail = player.availability !== 'available';
    // Warna background: asing = kuning muda berborder, lokal = abu sangat muda
    const bg     = isForeign ? '#fefce8' : 'var(--neutral-50)';
    const border = isForeign ? '1px solid #f59e0b' : '1px solid var(--neutral-200)';
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <button
          onClick={() => pickPlayer(player.id, squad, starters, setStarters, subs, setSubs, asingList, setAsing)}
          title={isUnavail ? player.availability : 'Klik untuk tambah ke lineup'}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8, border: border,
            cursor: 'pointer', textAlign: 'left',
            background: bg, color: 'var(--neutral-800)',
            fontSize: 12, fontWeight: isForeign ? 600 : 400,
            opacity: isUnavail ? 0.55 : 1,
            transition: 'background 0.1s, opacity 0.1s',
          }}>
          {renderFlag(player)}
          <span style={{ fontSize: 10, minWidth: 20, color: 'var(--neutral-500)', fontWeight: 700, flexShrink: 0 }}>
            #{player.shirtNumber}
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.displayName}
          </span>
          <span style={{ fontSize: 9, color: 'var(--neutral-400)', flexShrink: 0, letterSpacing: 0.3 }}>
            {posLabel[player.position] || 'MF'}
          </span>
          {isUnavail && (
            <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 800, flexShrink: 0 }}>
              {player.availability === 'injured' ? 'CED' : 'SUS'}
            </span>
          )}
        </button>
      </div>
    );
  };

  // â”€â”€ SELECTED ITEM: klik = kembalikan ke pool â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderSelectedItem = (
    player: Player,
    isStarter: boolean,
    captain: string, setCaptain: React.Dispatch<React.SetStateAction<string>>,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    accentColor: string
  ) => {
    const isForeign = player.nationality !== 'Indonesia';
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <button
          onClick={() => returnToPool(player.id, starters, setStarters, subs, setSubs)}
          title="Klik untuk kembalikan ke pool"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
            background: accentColor, color: 'white', fontSize: 12, fontWeight: 600
          }}>
          {renderFlag(player)}
          <span style={{ fontSize: 10, minWidth: 18, opacity: 0.8 }}>#{player.shirtNumber}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.displayName}</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>{posLabel[player.position] || 'MF'}</span>
          {isForeign && <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 800 }}>INT</span>}
        </button>
        {isStarter && (
          <button onClick={() => setCaptain(captain === player.id ? '' : player.id)}
            title="Tandai kapten"
            style={{
              padding: '5px 7px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
              fontSize: 10, fontWeight: 800, flexShrink: 0,
              background: captain === player.id ? '#eab308' : 'transparent',
              color: captain === player.id ? '#000' : 'var(--neutral-400)',
              borderColor: captain === player.id ? '#eab308' : 'var(--neutral-200)'
            }}>C
          </button>
        )}
      </div>
    );
  };

  const renderTeamPanel = (
    side: 'home' | 'away',
    squad: Player[],
    club: Club | undefined,
    formation: string, setFormation: React.Dispatch<React.SetStateAction<string>>,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    captain: string, setCaptain: React.Dispatch<React.SetStateAction<string>>,
    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>,
    asingInput: { name: string; no: string; pos: string },
    setAsingInput: React.Dispatch<React.SetStateAction<{ name: string; no: string; pos: string }>>
  ) => {
    const isHome      = side === 'home';
    const accentColor = isHome ? 'var(--primary-600)' : '#374151';
    const subColor    = isHome ? '#0284c7' : '#6b7280';
    const valid       = starters.length === 11;
    const hasGK       = squad.some(p => starters.includes(p.id) && p.position === 'Goalkeeper');
    // Pool: hanya pemain yang belum dipilih (tidak ada di starters/subs)
    const pool = squad.filter(p => !starters.includes(p.id) && !subs.includes(p.id));
    const starterList = squad.filter(p => starters.includes(p.id))
      .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position)
                   - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position));
    const subList = squad.filter(p => subs.includes(p.id));
    const fSt  = squad.filter(p => starters.includes(p.id) && p.nationality !== 'Indonesia').length;
    const fSub = squad.filter(p => subs.includes(p.id) && p.nationality !== 'Indonesia').length;
    const fDibawa = fSt + fSub; // total asing dibawa per pertandingan

    // Asing di pool = terdaftar di squad tapi tidak dibawa ke match (tidak masuk DSP pertandingan)
    const foreignPool = pool.filter(p => p.nationality !== 'Indonesia');
    return (
      <div className="lineup-team-panel">
        {/* Header */}
        <div className="lineup-team-header" style={{ background: accentColor }}>
          {club?.logoUrl && club.logoUrl.startsWith('http')
            ? <img src={club.logoUrl} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
            : <span style={{ fontSize: 18, fontWeight: 700 }}>{isHome ? 'H' : 'A'}</span>}
          <span style={{ fontWeight: 700, fontSize: 13 }}>{isHome ? 'HOME' : 'AWAY'}: {club?.name}</span>
          <select value={formation} onChange={e => setFormation(e.target.value)}
            style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 6px', borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.25)', color: 'white' }}>
            {FORMATIONS.map(fm => <option key={fm} value={fm} style={{ color: 'black', background: 'white' }}>{fm}</option>)}
          </select>
          <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', padding: '2px 8px', borderRadius: 10,
            background: valid && hasGK ? 'rgba(34,197,94,0.35)' : 'rgba(234,179,8,0.35)' }}>
            {starters.length}/11{!hasGK && starters.length > 0 ? ' (GK?)' : ''}
          </span>
        </div>

        <div className="lineup-cols-grid">

          {/* â”€â”€ KOLOM 1: POOL (pemain belum dipilih) â”€â”€ */}
          <div className="lineup-col">
            <div className="lineup-col-header">
              Daftar Pemain ({pool.length})
            </div>
            <div style={{ fontSize: 10, color: 'var(--neutral-400)', marginBottom: 8, lineHeight: 1.4 }}>
              Klik nama = masuk Starting XI otomatis.
              Kuning = pemain asing.
            </div>
            {pool.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '16px 0' }}>
                Semua pemain sudah dipilih
              </div>
            )}
            {['Goalkeeper','Defender','Midfielder','Forward'].map(pos => {
              const pp = pool.filter(p => p.position === pos);
              if (!pp.length) return null;
              return (
                <div key={pos} className="pool-pos-group" style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase',
                    marginBottom: 4, paddingBottom: 2, borderBottom: '1px solid var(--neutral-100)' }}>
                    {pos === 'Goalkeeper' ? 'GK' : pos === 'Defender' ? 'DF' : pos === 'Midfielder' ? 'MF' : 'FW'}
                    <span style={{ fontWeight: 400, marginLeft: 4 }}>({pp.length})</span>
                  </div>
                  {pp.map(p => renderPoolItem(p, squad, starters, setStarters, subs, setSubs, asingList, setAsing))}
                </div>
              );
            })}
          </div>

          {/* â”€â”€ KOLOM 2: STARTING XI â”€â”€ */}
          <div className="lineup-col" style={{ borderLeft: '1px solid var(--neutral-100)' }}>
            <div className="lineup-col-header" style={{ color: accentColor }}>
              Starting XI ({starters.length}/11)
              {fSt > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: '#92400e', marginLeft: 6,
                background: '#fef3c7', padding: '1px 5px', borderRadius: 6 }}>
                {fSt} asing
              </span>}
            </div>
            {starterList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '16px 8px', lineHeight: 1.5 }}>
                Pilih pemain dari daftar kiri.
                <br />Klik di sini untuk kembalikan ke pool.
              </div>
            ) : (
              starterList.map(p => renderSelectedItem(p, true, captain, setCaptain, starters, setStarters, subs, setSubs, accentColor))
            )}
            {asingList.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                borderRadius: 8, background: accentColor, color: 'white', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span style={{ fontSize: 10, opacity: 0.8, minWidth: 20 }}>#{a.no}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{a.pos} INT*</span>
                <button onClick={() => setAsing(p => p.filter(x => x.id !== a.id))}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2, fontWeight: 700 }}>x</button>
              </div>
            ))}
          </div>

          {/* â”€â”€ KOLOM 3: CADANGAN + NON-DSP â”€â”€ */}
          <div className="lineup-col" style={{ borderLeft: '1px solid var(--neutral-100)' }}>
            <div className="lineup-col-header" style={{ color: subColor }}>
              Cadangan ({subs.length}/{MAX_SUBS})
              {fSub > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: '#92400e', marginLeft: 6,
                background: '#fef3c7', padding: '1px 5px', borderRadius: 6 }}>
                {fSub} asing
              </span>}
            </div>
            {subList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '8px 0' }}>
                Otomatis terisi setelah 11 starter dipilih
              </div>
            ) : (
              subList.map(p => renderSelectedItem(p, false, captain, setCaptain, starters, setStarters, subs, setSubs, subColor))
            )}




            {/* TIDAK MASUK DSP PERTANDINGAN */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--neutral-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                  Tidak Masuk DSP
                </span>
                <span style={{ fontSize: 9, fontWeight: 700,
                  background: fDibawa >= MAX_ASING_DIBAWA ? '#fee2e2' : '#fef3c7',
                  color: fDibawa >= MAX_ASING_DIBAWA ? '#991b1b' : '#92400e',
                  padding: '1px 7px', borderRadius: 6 }}>
                  Dibawa: {fDibawa}/{MAX_ASING_DIBAWA}
                </span>
              </div>
              {foreignPool.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--neutral-400)', textAlign: 'center', padding: '8px 0' }}>
                  Semua asing masuk DSP pertandingan
                </div>
              ) : (
                foreignPool.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                    borderRadius: 8, background: '#fef3c7', border: '1px solid #f59e0b',
                    fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#78350f' }}>
                    {renderFlag(p)}
                    <span style={{ fontSize: 10, minWidth: 20, opacity: 0.75 }}>#{p.shirtNumber}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>{posLabel[p.position] || 'MF'}</span>
                  </div>
                ))
              )}
              <div style={{ marginTop: 8, fontSize: 9, color: 'var(--neutral-400)', lineHeight: 1.5,
                padding: '5px 7px', background: 'var(--neutral-50)', borderRadius: 6 }}>
                Maks 7 asing starting | 9 dibawa | 11 DSP liga
              </div>
            </div>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div className="lineup-editor-root">

      {/* HEADER */}
      <div className="lineup-editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button className="btn btn-sm btn-secondary" onClick={onClose} style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
            <span className="hide-mobile"> Kembali</span>
          </button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isNew ? 'Buat Lineup' : `Edit: ${existingMatch?.homeClubName} vs ${existingMatch?.awayClubName}`}
            </h2>
            <div style={{ fontSize: 10, color: 'var(--neutral-500)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              <span style={{ color: homeValid && homeHasGK ? 'var(--success-600)' : 'var(--warning-600)', fontWeight: 600 }}>
                Home {homeStarters.length}/11{homeHasGK ? '' : ' (GK?)'}</span>
              <span style={{ color: awayValid && awayHasGK ? 'var(--success-600)' : 'var(--warning-600)', fontWeight: 600 }}>
                Away {awayStarters.length}/11{awayHasGK ? '' : ' (GK?)'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowPreviewModal(true)}>Preview</button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleSave(false)}>Draft</button>
          <button className="btn btn-sm btn-primary" onClick={() => handleSave(true)}>
            <Upload size={13} /><span className="hide-mobile"> Terbitkan</span>
          </button>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="card lineup-info-bar">
        <div className="lineup-info-grid">
          <div>
            <label className="lineup-field-label">Kompetisi</label>
            <select className="form-select" style={{ fontSize: 12 }} value={selectedCompetitionName} disabled={matchInfoLocked} onChange={e => setSelectedCompetitionName(e.target.value)}>
              {competitions.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              {competitions.filter(c => !c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} (nonaktif)</option>)}
            </select>
          </div>
          <div>
            <label className="lineup-field-label">Tim Home</label>
            <select className="form-select" style={{ fontSize: 12 }} value={selectedHomeClub}
              disabled={matchInfoLocked}
              onChange={e => { setSelectedHomeClub(e.target.value); setHomeStarters([]); setHomeSubs([]); setHomeCaptain(''); }}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="lineup-field-label">Tim Away</label>
            <select className="form-select" style={{ fontSize: 12 }} value={selectedAwayClub}
              disabled={matchInfoLocked}
              onChange={e => { setSelectedAwayClub(e.target.value); setAwayStarters([]); setAwaySubs([]); setAwayCaptain(''); }}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="lineup-field-label">Kickoff</label>
            <input type="datetime-local" className="form-input" style={{ fontSize: 11 }}
              value={kickoffTime.slice(0, 16)} disabled={matchInfoLocked} onChange={e => setKickoffTime(new Date(e.target.value).toISOString())} />
          </div>
          <div className="lineup-venue-field">
            <label className="lineup-field-label">Venue <span style={{ fontWeight: 400, fontSize: 9 }}>(auto, editable)</span></label>
            <input type="text" className="form-input" style={{ fontSize: 12 }} placeholder="Nama stadion..." value={venueName} onChange={e => setVenueName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TEAM PANELS */}
      <div className="lineup-teams-grid">
        {renderTeamPanel('home', homeSquad, homeClub, homeFormation, setHomeFormation,
          homeStarters, setHomeStarters, homeSubs, setHomeSubs,
          homeCaptain, setHomeCaptain, homeAsing, setHomeAsing, homeAsingInput, setHomeAsingInput)}
        {renderTeamPanel('away', awaySquad, awayClub, awayFormation, setAwayFormation,
          awayStarters, setAwayStarters, awaySubs, setAwaySubs,
          awayCaptain, setAwayCaptain, awayAsing, setAwayAsing, awayAsingInput, setAwayAsingInput)}
      </div>

      {/* PREVIEW MODAL */}

      {showPreviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
          onClick={() => setShowPreviewModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxHeight: '95vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {isPublishedLineup ? (
                <>
                  <button className="btn btn-md btn-primary" onClick={shareLineupStory} disabled={isExportingStory}>
                    <Share2 size={14} /> Bagikan Story
                  </button>
                  <button className="btn btn-md btn-secondary" onClick={downloadLineupStory} disabled={isExportingStory}>
                    <Download size={14} /> Unduh PNG
                  </button>
                </>
              ) : (
                <button className="btn btn-md btn-secondary" disabled title="Publish lineup dulu untuk membuka share dan download story.">
                  <Lock size={14} /> Publish Dulu
                </button>
              )}
              <button className="btn btn-md btn-secondary" onClick={() => setShowPreviewModal(false)}>
                <X size={14} /> Tutup
              </button>
            </div>

            <div id="lineup-story-card" style={{
              width: 360, minHeight: 640,
              background: '#0a0a0a',
              color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 30px 60px rgba(0,0,0,0.9)', position: 'relative',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />

              <div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {(() => {
                  const comp = competitions.find(c => c.name === selectedCompetitionName);
                  return comp?.logoUrl && comp.logoUrl.startsWith('http')
                    ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, background: 'white', borderRadius: 4, padding: 2 }} />
                    : <div style={{ width: 30, height: 30, background: 'rgba(200,168,75,0.12)', borderRadius: 4,
                        border: '1px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 12, height: 12, background: '#c8a84b', borderRadius: 2 }} />
                      </div>;
                })()}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: '#c8a84b', letterSpacing: 2, textTransform: 'uppercase' }}>
                    {selectedCompetitionName}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'white', letterSpacing: 0.3, marginTop: 1 }}>SUSUNAN PEMAIN</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 48 }}>
                  <img src={APP_LOGO_SRC} alt={APP_NAME} style={{ width: 44, height: 32, objectFit: 'contain' }} />
                </div>
              </div>

              <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  {homeClub?.logoUrl && homeClub.logoUrl.startsWith('http')
                    ? <img src={homeClub.logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
                    : <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{homeClub?.shortName}</div>
                    <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{homeFormation}</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: 2, padding: '0 10px' }}>VS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
                  {awayClub?.logoUrl && awayClub.logoUrl.startsWith('http')
                    ? <img src={awayClub.logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
                    : <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{awayClub?.shortName}</div>
                    <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{awayFormation}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flex: 1 }}>

                <div style={{ flex: 1, padding: '10px 10px 10px 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5,
                    textTransform: 'uppercase', marginBottom: 7, paddingBottom: 4,
                    borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
                    {homeClub?.code || 'HOME'} - STARTING
                  </div>
                  {homeSquad.filter(p => homeStarters.includes(p.id))
                    .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position)
                                 - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position))
                    .map(p => {
                      const isForeign = p.nationality !== 'Indonesia';
                      const isCaptain = p.id === homeCaptain;
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                          <span style={{ fontSize: 8, color: '#c8a84b', fontWeight: 700, minWidth: 22, fontVariantNumeric: 'tabular-nums' }}>
                            {p.shirtNumber}
                          </span>
                          {isForeign ? renderStoryFlag(p, 12, 8, 9) : null}
                          <span style={{ fontSize: 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: isCaptain ? '#c8a84b' : isForeign ? '#93c5fd' : '#e2e8f0',
                            fontWeight: isCaptain ? 700 : 400 }}>
                            {p.displayName}{isCaptain ? ' (C)' : ''}
                          </span>
                        </div>
                      );
                    })}

                  {homeSubs.length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '7px 0 4px', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        CADANGAN
                      </div>
                      {homeSquad.filter(p => homeSubs.includes(p.id)).map(p => {
                        const isForeign = p.nationality !== 'Indonesia';
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                            <span style={{ fontSize: 7, color: '#555', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                            {isForeign ? renderStoryFlag(p, 10, 7, 8) : null}
                            <span style={{ fontSize: 8, color: isForeign ? '#6b7280' : '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.displayName}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {homeSquad.filter(p => !homeStarters.includes(p.id) && !homeSubs.includes(p.id) && p.nationality !== 'Indonesia').length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#333', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '6px 0 3px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        NON-DSP
                      </div>
                      {homeSquad.filter(p => !homeStarters.includes(p.id) && !homeSubs.includes(p.id) && p.nationality !== 'Indonesia').map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#333', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                          {renderStoryFlag(p, 10, 7, 8)}
                          <span style={{ fontSize: 8, color: '#3f4855', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.displayName}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div style={{ flex: 1, padding: '10px 16px 10px 10px' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5,
                    textTransform: 'uppercase', marginBottom: 7, paddingBottom: 4,
                    borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
                    {awayClub?.code || 'AWAY'} - STARTING
                  </div>
                  {awaySquad.filter(p => awayStarters.includes(p.id))
                    .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position)
                                 - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position))
                    .map(p => {
                      const isForeign = p.nationality !== 'Indonesia';
                      const isCaptain = p.id === awayCaptain;
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                          <span style={{ fontSize: 8, color: '#c8a84b', fontWeight: 700, minWidth: 22, fontVariantNumeric: 'tabular-nums' }}>
                            {p.shirtNumber}
                          </span>
                          {isForeign ? renderStoryFlag(p, 12, 8, 9) : null}
                          <span style={{ fontSize: 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: isCaptain ? '#c8a84b' : isForeign ? '#93c5fd' : '#e2e8f0',
                            fontWeight: isCaptain ? 700 : 400 }}>
                            {p.displayName}{isCaptain ? ' (C)' : ''}
                          </span>
                        </div>
                      );
                    })}

                  {awaySubs.length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '7px 0 4px', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        CADANGAN
                      </div>
                      {awaySquad.filter(p => awaySubs.includes(p.id)).map(p => {
                        const isForeign = p.nationality !== 'Indonesia';
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                            <span style={{ fontSize: 7, color: '#555', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                            {isForeign ? renderStoryFlag(p, 10, 7, 8) : null}
                            <span style={{ fontSize: 8, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.displayName}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {awaySquad.filter(p => !awayStarters.includes(p.id) && !awaySubs.includes(p.id) && p.nationality !== 'Indonesia').length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#333', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '6px 0 3px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        NON-DSP
                      </div>
                      {awaySquad.filter(p => !awayStarters.includes(p.id) && !awaySubs.includes(p.id) && p.nationality !== 'Indonesia').map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#333', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                          {renderStoryFlag(p, 10, 7, 8)}
                          <span style={{ fontSize: 8, color: '#3f4855', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.displayName}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>











              <div style={{ padding: '8px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.06)' }}>




                  <div style={{ fontSize: 7, color: '#3a3a3a', marginTop: 1 }}>{venueName}</div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#c8a84b', letterSpacing: 1 }}>GOSBALL</div>
                  <div style={{ fontSize: 7, color: '#444', marginTop: 1 }}>{APP_HANDLE}</div>
                </div>
              </div>

              <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
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
  competitions: Competition[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function MatchResultsListView({ matches, competitions, onEdit, hasPermission }: MatchResultsListProps) {
  const [selectedComp, setSelectedComp] = useState('Semua');
  const filteredMatches = matches
    .filter(match => match.lineupStatus === 'Complete')
    .filter(match => selectedComp === 'Semua' || match.competition === selectedComp)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
  const statusLabel = (s: string) => ({ Scheduled: 'Dijadwalkan', Live: 'Live', Finished: 'Selesai', Postponed: 'Ditunda', Cancelled: 'Dibatalkan' }[s] || s);

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
          {competitions.map(comp => (
            <option key={comp.id} value={comp.name}>{comp.name}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pertandingan</th>
              <th>Kompetisi</th>
              <th>HT</th>
              <th>FT</th>
              <th>Status</th>
              <th>Lineup</th>
              <th>Publikasi</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map(match => {
              const canInputResult = match.lineupStatus === 'Complete';
              return (
                <tr key={match.id}>
                  <td>
                    <div className="flex align-center gap-12">
                      {match.homeLogo && match.homeLogo.startsWith('http')
                        ? <img src={match.homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 20 }}>{match.homeLogo}</span>}
                      <span className="semibold">{match.homeClubName} vs {match.awayClubName}</span>
                      {match.awayLogo && match.awayLogo.startsWith('http')
                        ? <img src={match.awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 20 }}>{match.awayLogo}</span>}
                    </div>
                  </td>
                  <td>{match.competition}</td>
                  <td>
                    {match.halfTimeHomeScore !== undefined && match.halfTimeHomeScore !== null && match.halfTimeAwayScore !== undefined && match.halfTimeAwayScore !== null ? (
                      <span className="semibold">{match.halfTimeHomeScore} - {match.halfTimeAwayScore}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null ? (
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{match.homeScore} - {match.awayScore}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${match.status === 'Finished' ? 'badge-success' : match.status === 'Live' ? 'badge-danger' : 'badge-warning'}`}>
                      {statusLabel(match.status)}
                    </span>
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
                    <button className="btn btn-sm btn-secondary" disabled={!canInputResult || !hasPermission('Match Result', 'create_edit')} title={canInputResult ? 'Input hasil HT/FT' : 'Lengkapi lineup terlebih dahulu'} onClick={() => onEdit(match.id)}>
                      Input HT/FT
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
  competitions: Competition[];
}

interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  playerName: string;
  clubId: string;
}

function MatchResultEditorView({ matchId, clubs, players, matches, competitions, onClose, onSave, triggerToast, logAction }: MatchResultEditorProps) {
  const foundMatch = matches.find(m => m.id === matchId);
  const matchMissing = !foundMatch;
  const match: Match = foundMatch || {
    id: matchId,
    homeClubId: '',
    homeClubName: '',
    homeLogo: '',
    awayClubId: '',
    awayClubName: '',
    awayLogo: '',
    competition: '',
    season: '',
    kickoff: new Date().toISOString(),
    venue: '',
    status: 'Scheduled',
    lineupStatus: 'Draft',
    publicationStatus: 'Draft',
    editor: 'Admin',
    lastUpdated: '',
  };

  // Editor states
  // Initialize FT scores to 0 if match is not Finished (to keep it clean and locked)
  const [homeScore, setHomeScore] = useState<number | ''>(
    match.status === 'Finished' && match.homeScore !== undefined && match.homeScore !== null ? match.homeScore : 0
  );
  const [awayScore, setAwayScore] = useState<number | ''>(
    match.status === 'Finished' && match.awayScore !== undefined && match.awayScore !== null ? match.awayScore : 0
  );
  const [halfTimeHomeScore, setHalfTimeHomeScore] = useState<number | ''>(
    match.halfTimeHomeScore !== undefined && match.halfTimeHomeScore !== null ? match.halfTimeHomeScore : 0
  );
  const [halfTimeAwayScore, setHalfTimeAwayScore] = useState<number | ''>(
    match.halfTimeAwayScore !== undefined && match.halfTimeAwayScore !== null ? match.halfTimeAwayScore : 0
  );
  const [matchStatus, setMatchStatus] = useState<'Scheduled' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled'>(match.status);
  // Lock Full Time inputs by default unless the match is already marked as Finished
  const [showFullTime, setShowFullTime] = useState<boolean>(match.status === 'Finished');

  // Instagram graphic options
  // Instagram graphic options - default to 'HT' (Half Time) first to prevent UX confusion
  const [graphicType, setGraphicType] = useState<'HT' | 'FT'>('HT');
  const [graphicRatio, setGraphicRatio] = useState<'1:1' | '4:5'>('1:1');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isExportingGraphic, setIsExportingGraphic] = useState(false);
  const isHtScoresFilled = halfTimeHomeScore !== '' && halfTimeHomeScore !== undefined && halfTimeHomeScore !== null &&
                          halfTimeAwayScore !== '' && halfTimeAwayScore !== undefined && halfTimeAwayScore !== null;

  // Safety confirmation states
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [safetyReason, setSafetyReason] = useState('');

    // Timeline events state - loaded from database match.timeline
  const [events, setEvents] = useState<MatchEvent[]>(
    Array.isArray(match.timeline) && match.timeline.length > 0 
      ? match.timeline 
      : []
  );

  // Helper to load roster players from lineup
  const getLineupPlayersForClub = (clubId: string) => {
    const isHome = clubId === match.homeClubId;
    const startersIds = isHome ? (match.homeStarters || []) : (match.awayStarters || []);
    const subsIds = isHome ? (match.homeSubs || []) : (match.awaySubs || []);
    const asingPlayers = isHome ? (match.homeAsing || []) : (match.awayAsing || []);

    const localStarters = players.filter(p => startersIds.includes(p.id));
    const localSubs = players.filter(p => subsIds.includes(p.id));

    const list: { id: string; name: string; number?: number; isForeign?: boolean }[] = [];

    localStarters.forEach(p => {
      list.push({ id: p.id, name: p.displayName || p.fullName, number: p.shirtNumber });
    });

    localSubs.forEach(p => {
      list.push({ id: p.id, name: p.displayName || p.fullName, number: p.shirtNumber });
    });

    asingPlayers.forEach((p: any) => {
      list.push({ id: p.id, name: p.name, number: p.no, isForeign: true });
    });

    return list;
  };
  const shareResultGraphic = async () => {
    const node = document.getElementById('match-feed-card');
    if (!node) return;
    try {
      setIsExportingGraphic(true);
      triggerToast('Membuat gambar untuk dibagikan...');
      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: 2.7,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const fileName = `Result_${graphicType}_${match.homeClubName}_vs_${match.awayClubName}_${graphicRatio.replace(':', '_')}.png`.replace(/[^\w.-]+/g, '_');
      const file = new File([blob], fileName, { type: 'image/png' });
      
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: `${match.homeClubName} vs ${match.awayClubName}`,
        text: `Hasil pertandingan ${match.homeClubName} vs ${match.awayClubName}`,
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Gambar siap dibagikan.');
        return;
      }

      // Fallback to download
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Bagikan langsung tidak didukung di perangkat ini. Gambar diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.error('Failed to share result graphic:', err);
        triggerToast('Gagal membagikan gambar.', 'error');
      }
    } finally {
      setIsExportingGraphic(false);
    }
  };

  const downloadResultGraphic = async () => {
    const node = document.getElementById('match-feed-card');
    if (!node) return;
    try {
      setIsExportingGraphic(true);
      triggerToast('Mengunduh gambar...');
      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: 2.7,
      });
      const fileName = `Result_${graphicType}_${match.homeClubName}_vs_${match.awayClubName}_${graphicRatio.replace(':', '_')}.png`.replace(/[^\w.-]+/g, '_');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Gambar berhasil diunduh!');
    } catch (err) {
      console.error('Failed to download result graphic:', err);
      triggerToast('Gagal mengunduh gambar.', 'error');
    } finally {
      setIsExportingGraphic(false);
    }
  };

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

    // Validation for goal counts in timeline vs pre-filled HT / FT scores
    if (newEventType === 'goal') {
      const isHome = String(newEventClub) === String(match.homeClubId);
      const limitHT = isHome ? halfTimeHomeScore : halfTimeAwayScore;
      const limitFT = isHome ? homeScore : awayScore;

      // Count goals in HT (<= 45 mins)
      const currentHTGoalsCount = events.filter(
        e => e.type === 'goal' && String(e.clubId) === String(newEventClub) && e.minute <= 45
      ).length;

      // Count total goals
      const currentTotalGoalsCount = events.filter(
        e => e.type === 'goal' && String(e.clubId) === String(newEventClub)
      ).length;

      if (newEventMinute <= 45) {
        // HT goal validation
        const targetHT = (limitHT === '' ? 0 : Number(limitHT));
        if (currentHTGoalsCount + 1 > targetHT) {
          triggerToast(
            `Peringatan: Jumlah gol babak pertama (${isHome ? 'Home' : 'Away'}) di timeline (${currentHTGoalsCount + 1}) melebihi skor HT (${targetHT})!`,
            'warning'
          );
          return;
        }
      } else {
        // FT goal validation (minute > 45)
        if (!showFullTime) {
          triggerToast('Peringatan: Aktifkan "Pertandingan Selesai" terlebih dahulu untuk menambahkan gol babak kedua!', 'warning');
          return;
        }
        const targetFT = (limitFT === '' ? 0 : Number(limitFT));
        if (currentTotalGoalsCount + 1 > targetFT) {
          triggerToast(
            `Peringatan: Total gol (${isHome ? 'Home' : 'Away'}) di timeline (${currentTotalGoalsCount + 1}) melebihi skor FT (${targetFT})!`,
            'warning'
          );
          return;
        }
      }
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

  if (matchMissing) {
    return (
      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Pertandingan tidak ditemukan</h2>
        <p className="text-muted" style={{ marginBottom: 16 }}>Pilih pertandingan dari jadwal atau lineup yang sudah lengkap.</p>
        <button className="btn btn-sm btn-secondary" onClick={onClose}><ArrowLeft size={16} /> Kembali</button>
      </div>
    );
  }

  const handleSaveWithSafetyCheck = () => {
    const isFtHomeFilled = homeScore !== '' && homeScore !== undefined;
    const isFtAwayFilled = awayScore !== '' && awayScore !== undefined;
    const isHtHomeFilled = halfTimeHomeScore !== '' && halfTimeHomeScore !== undefined;
    const isHtAwayFilled = halfTimeAwayScore !== '' && halfTimeAwayScore !== undefined;

    if ((isHtHomeFilled && isFtHomeFilled && (halfTimeHomeScore as number) > (homeScore as number)) ||
        (isHtAwayFilled && isFtAwayFilled && (halfTimeAwayScore as number) > (awayScore as number))) {
      triggerToast('Skor half time tidak boleh lebih besar dari skor akhir.', 'error');
      return;
    }

    // Goal count validation on save
    const htHomeGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.homeClubId) && e.minute <= 45).length;
    const htAwayGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.awayClubId) && e.minute <= 45).length;
    
    const targetHtHome = halfTimeHomeScore === '' ? 0 : Number(halfTimeHomeScore);
    const targetHtAway = halfTimeAwayScore === '' ? 0 : Number(halfTimeAwayScore);

    if (htHomeGoals > targetHtHome) {
      triggerToast(`Jumlah gol HT Home di timeline (${htHomeGoals}) melebihi skor HT (${targetHtHome})!`, 'error');
      return;
    }
    if (htAwayGoals > targetHtAway) {
      triggerToast(`Jumlah gol HT Away di timeline (${htAwayGoals}) melebihi skor HT (${targetHtAway})!`, 'error');
      return;
    }

    if (showFullTime || matchStatus === 'Finished') {
      const ftHomeGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.homeClubId)).length;
      const ftAwayGoals = events.filter(e => e.type === 'goal' && String(e.clubId) === String(match.awayClubId)).length;
      
      const targetFtHome = homeScore === '' ? 0 : Number(homeScore);
      const targetFtAway = awayScore === '' ? 0 : Number(awayScore);

      if (ftHomeGoals > targetFtHome) {
        triggerToast(`Total gol Home di timeline (${ftHomeGoals}) melebihi skor FT (${targetFtHome})!`, 'error');
        return;
      }
      if (ftAwayGoals > targetFtAway) {
        triggerToast(`Total gol Away di timeline (${ftAwayGoals}) melebihi skor FT (${targetFtAway})!`, 'error');
        return;
      }
    }

    // If score changed and was already published
    const scoreChanged =
      (homeScore === '' ? null : homeScore) !== (match.homeScore ?? null) ||
      (awayScore === '' ? null : awayScore) !== (match.awayScore ?? null) ||
      (halfTimeHomeScore === '' ? null : halfTimeHomeScore) !== (match.halfTimeHomeScore ?? null) ||
      (halfTimeAwayScore === '' ? null : halfTimeAwayScore) !== (match.halfTimeAwayScore ?? null);
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
      homeScore: homeScore === '' ? null : (homeScore as any),
      awayScore: awayScore === '' ? null : (awayScore as any),
      halfTimeHomeScore: halfTimeHomeScore === '' ? null : (halfTimeHomeScore as any),
      halfTimeAwayScore: halfTimeAwayScore === '' ? null : (halfTimeAwayScore as any),
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
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Skor Half Time, Full Time & Status</h3>

          <div className="flex align-center justify-between" style={{ padding: '20px 0', borderBottom: '1px solid var(--neutral-100)' }}>
            {/* Home score HT */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                {match.homeLogo && match.homeLogo.startsWith('http') ? (
                  <img src={match.homeLogo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 30 }}>{match.homeLogo || '⚽'}</span>
                )}
              </div>
              <div className="semibold" style={{ fontSize: 14, margin: '4px 0' }}>{match.homeClubName}</div>
              <label className="form-label" style={{ textAlign: 'center', marginTop: 6, fontSize: 11 }}>Skor Babak Pertama (HT)</label>
              <input 
                type="number" 
                min={0} 
                className="form-input" 
                style={{ width: 85, fontSize: 18, textAlign: 'center' }} 
                value={halfTimeHomeScore} 
                onChange={(e) => setHalfTimeHomeScore(e.target.value === '' ? '' : Number(e.target.value))} 
              />
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--neutral-300)' }}>VS</div>

            {/* Away score HT */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                {match.awayLogo && match.awayLogo.startsWith('http') ? (
                  <img src={match.awayLogo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 30 }}>{match.awayLogo || '⚽'}</span>
                )}
              </div>
              <div className="semibold" style={{ fontSize: 14, margin: '4px 0' }}>{match.awayClubName}</div>
              <label className="form-label" style={{ textAlign: 'center', marginTop: 6, fontSize: 11 }}>Skor Babak Pertama (HT)</label>
              <input 
                type="number" 
                min={0} 
                className="form-input" 
                style={{ width: 85, fontSize: 18, textAlign: 'center' }} 
                value={halfTimeAwayScore} 
                onChange={(e) => setHalfTimeAwayScore(e.target.value === '' ? '' : Number(e.target.value))} 
              />
            </div>
          </div>

          {/* Full Time score toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 14 }}>
            <label className="flex align-center gap-8 semibold cursor-pointer" style={{ fontSize: 13, userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={showFullTime} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowFullTime(checked);
                  if (checked) {
                    setMatchStatus('Finished');
                    // Carry-over HT scores to FT if FT is currently empty or zero
                    if (homeScore === 0 || homeScore === '') {
                      setHomeScore(halfTimeHomeScore !== '' ? halfTimeHomeScore : 0);
                    }
                    if (awayScore === 0 || awayScore === '') {
                      setAwayScore(halfTimeAwayScore !== '' ? halfTimeAwayScore : 0);
                    }
                  } else {
                    setMatchStatus('Live');
                    setHomeScore(0);
                    setAwayScore(0);
                  }
                }} 
              />
              Pertandingan Selesai? Masukkan Skor Akhir (Full Time)
            </label>
          </div>

          {/* Full Time score inputs (shown progressively) */}
          {showFullTime && (
            <div className="flex align-center justify-between" style={{ padding: '14px 0', backgroundColor: 'var(--neutral-50)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <label className="form-label" style={{ textAlign: 'center', fontSize: 11 }}>Skor Akhir Home (FT)</label>
                <input 
                  type="number" 
                  min={0} 
                  className="form-input" 
                  style={{ width: 85, fontSize: 22, textAlign: 'center', fontWeight: 'bold' }} 
                  value={homeScore} 
                  onChange={(e) => setHomeScore(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-300)' }}>FT</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <label className="form-label" style={{ textAlign: 'center', fontSize: 11 }}>Skor Akhir Away (FT)</label>
                <input 
                  type="number" 
                  min={0} 
                  className="form-input" 
                  style={{ width: 85, fontSize: 22, textAlign: 'center', fontWeight: 'bold' }} 
                  value={awayScore} 
                  onChange={(e) => setAwayScore(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <label className="form-label">Status Pertandingan</label>
            <select 
              className="form-select" 
              value={matchStatus} 
              onChange={(e: any) => {
                const val = e.target.value;
                setMatchStatus(val);
                if (val === 'Finished') {
                  setShowFullTime(true);
                  // Carry-over HT scores to FT if FT is currently empty or zero
                  if (homeScore === 0 || homeScore === '') {
                    setHomeScore(halfTimeHomeScore !== '' ? halfTimeHomeScore : 0);
                  }
                  if (awayScore === 0 || awayScore === '') {
                    setAwayScore(halfTimeAwayScore !== '' ? halfTimeAwayScore : 0);
                  }
                } else {
                  setShowFullTime(false);
                  setHomeScore(0);
                  setAwayScore(0);
                }
              }}
            >
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
                  <option value="goal">⚽ Gol</option>
                  <option value="yellow_card">🟨 Kartu Kuning</option>
                  <option value="red_card">🟥 Kartu Merah</option>
                  <option value="substitution">🔄 Pergantian Pemain</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Klub Asal</label>
                <select 
                  className="form-select" 
                  value={newEventClub} 
                  onChange={(e) => {
                    setNewEventClub(e.target.value);
                    setNewEventPlayer(''); // Reset selected player when club changes
                  }}
                >
                  <option value={match.homeClubId}>{match.homeClubName}</option>
                  <option value={match.awayClubId}>{match.awayClubName}</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 6' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Nama Pemain</label>
                <select 
                  className="form-select" 
                  value={newEventPlayer} 
                  onChange={(e) => setNewEventPlayer(e.target.value)}
                >
                  <option value="">-- Pilih Pemain --</option>
                  {getLineupPlayersForClub(newEventClub).map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.number ? `(#${p.number})` : ''} {p.isForeign ? '(Asing)' : ''}
                    </option>
                  ))}
                </select>
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
        <div style={{ alignSelf: 'flex-start', width: '100%' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Instagram Feed Graphic</h3>
          <p className="page-description" style={{ margin: 0 }}>Gunakan template premium ini untuk mempublikasikan hasil pertandingan ke feeds Instagram resmi.</p>
        </div>

        {!isHtScoresFilled ? (
          <div style={{
            width: '100%',
            maxWidth: 500,
            padding: '24px 16px',
            backgroundColor: 'var(--neutral-50)',
            border: '1px dashed var(--neutral-300)',
            borderRadius: 12,
            textAlign: 'center',
            color: 'var(--neutral-600)',
            fontSize: 13,
            fontWeight: 500
          }}>
            ⚠️ Silakan isi skor Half Time (HT) di atas terlebih dahulu untuk mengaktifkan preview dan unduhan Instagram Graphic.
          </div>
        ) : (
          <>
            {/* Control Panel */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%', maxWidth: 500, justifyContent: 'center' }}>
              {/* Content Type */}
              <div style={{ flex: '1 1 140px' }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Tipe Konten</label>
                <div style={{ display: 'flex', backgroundColor: 'var(--neutral-100)', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: graphicType === 'HT' ? 'var(--primary-600)' : 'transparent',
                      color: graphicType === 'HT' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setGraphicType('HT')}
                  >
                    Half Time
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: graphicType === 'FT' ? 'var(--primary-600)' : 'transparent',
                      color: graphicType === 'FT' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setGraphicType('FT')}
                  >
                    Full Time
                  </button>
                </div>
              </div>

              {/* Ratio Selection */}
              <div style={{ flex: '1 1 140px' }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Rasio Gambar</label>
                <div style={{ display: 'flex', backgroundColor: 'var(--neutral-100)', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: graphicRatio === '1:1' ? 'var(--primary-600)' : 'transparent',
                      color: graphicRatio === '1:1' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setGraphicRatio('1:1')}
                  >
                    1:1 Feed
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: graphicRatio === '4:5' ? 'var(--primary-600)' : 'transparent',
                      color: graphicRatio === '4:5' ? 'white' : 'var(--neutral-700)',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setGraphicRatio('4:5')}
                  >
                    4:5 Story
                  </button>
                </div>
              </div>

              {/* Background Image Upload */}
              <div style={{ flex: '1 1 180px' }}>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Gambar Background</label>
                <div className="flex gap-8 align-center" style={{ display: 'flex', alignItems: 'center' }}>
                  <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '6px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>📁</span> {backgroundImage ? 'Ganti Bg' : 'Pilih Gambar'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setBackgroundImage(event.target.result as string);
                              triggerToast('Gambar background berhasil diunggah!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {backgroundImage && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => {
                        setBackgroundImage(null);
                        triggerToast('Gambar background dihapus.');
                      }}
                    >
                      <span>🗑️</span> Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-12" style={{ width: '100%' }}>
              <button
                className="btn btn-md btn-primary flex-1 flex align-center justify-center gap-8"
                style={{ padding: '10px 24px', fontWeight: 600, letterSpacing: 0.5 }}
                onClick={shareResultGraphic}
                disabled={isExportingGraphic}
              >
                <Share2 size={16} /> Bagikan Gambar ({graphicType})
              </button>
              <button
                className="btn btn-md btn-secondary flex-1 flex align-center justify-center gap-8"
                style={{ padding: '10px 24px', fontWeight: 600, letterSpacing: 0.5 }}
                onClick={downloadResultGraphic}
                disabled={isExportingGraphic}
              >
                <Download size={16} /> Unduh PNG ({graphicRatio})
              </button>
            </div>

            {/* IG Feed Graphic Canvas */}
            <div 
              id="match-feed-card"
              style={{
                width: 400,
                height: graphicRatio === '1:1' ? 400 : 500,
                background: backgroundImage 
                  ? `linear-gradient(rgba(10, 10, 10, 0.15) 0%, rgba(10, 10, 10, 0.5) 45%, rgba(10, 10, 10, 0.95) 90%), url(${backgroundImage}) center/cover no-repeat` 
                  : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 16,
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                fontFamily: 'Inter, system-ui, sans-serif',
                overflow: 'hidden'
              }}
            >
              {/* Glowing accents (if no background image) */}
              {!backgroundImage && (
                <>
                  <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
                  <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
                </>
              )}

              {/* Gold Top Bar decoration */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', zIndex: 3 }} />

              {/* Header */}
              <div style={{ 
                zIndex: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: 'rgba(10, 10, 10, 0.65)', 
                backdropFilter: 'blur(4px)',
                borderRadius: 8,
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const comp = competitions.find(c => c.name === match.competition);
                    return comp?.logoUrl && comp.logoUrl.startsWith('http')
                      ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 20, height: 20, objectFit: 'contain', background: 'white', borderRadius: 3, padding: 1 }} />
                      : <div style={{ width: 18, height: 18, background: 'rgba(200,168,75,0.12)', borderRadius: 3, border: '1px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 6, height: 6, background: '#c8a84b', borderRadius: 1 }} />
                        </div>;
                  })()}
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    {match.competition || 'LIGA NUSANTARA UTAMA'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, backgroundColor: '#c8a84b', color: '#0a0a0a', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {graphicType === 'HT' ? 'HALF TIME' : 'FULL TIME'}
                  </span>
                  <img src={APP_LOGO_SRC} alt="" style={{ height: 14, objectFit: 'contain' }} />
                </div>
              </div>

              {/* Middle Clear Space */}
              <div style={{ flex: 1 }} />

              {/* Bottom Card Panel (Overlay container for matchup, scores and timeline) */}
              <div style={{
                zIndex: 2,
                backgroundColor: 'rgba(10, 10, 10, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 10,
                border: '1px solid rgba(200, 168, 75, 0.25)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                width: '100%',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
              }}>
                {/* Matchup & Scores inside the bottom card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  {/* Home Team */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {match.homeLogo && match.homeLogo.startsWith('http') ? (
                        <img src={match.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>{match.homeLogo || '⚽'}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {match.homeClubName.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Score Box */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {graphicType === 'HT' 
                        ? ((halfTimeHomeScore as any) !== '' ? halfTimeHomeScore : 0) 
                        : ((homeScore as any) !== '' ? homeScore : 0)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#555' }}>-</span>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {graphicType === 'HT' 
                        ? ((halfTimeAwayScore as any) !== '' ? halfTimeAwayScore : 0) 
                        : ((awayScore as any) !== '' ? awayScore : 0)}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
                    <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {match.awayLogo && match.awayLogo.startsWith('http') ? (
                        <img src={match.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>{match.awayLogo || '⚽'}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>
                        {match.awayClubName.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-text HT Score or Venue */}
                <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#888', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 6 }}>
                  {graphicType === 'FT' 
                    ? `HALF TIME: ${(halfTimeHomeScore as any) !== '' ? halfTimeHomeScore : 0} - ${(halfTimeAwayScore as any) !== '' ? halfTimeAwayScore : 0}` 
                    : (match.venue || 'Stadion Pertandingan')}
                </div>

                {/* Scorers Side-by-Side (Professional Editorial Layout) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, width: '100%', fontSize: 9 }}>
                  {/* Home Scorers (Left Aligned) */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {events
                      .filter(e => e.type === 'goal' && String(e.clubId) === String(match.homeClubId) && (graphicType === 'FT' || e.minute <= 45))
                      .map((evt) => (
                        <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0' }}>
                          <span style={{ color: '#c8a84b', fontWeight: 700 }}>{evt.minute}'</span>
                          <span>⚽ {evt.playerName}</span>
                        </div>
                      ))}
                  </div>

                  {/* Away Scorers (Right Aligned) */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                    {events
                      .filter(e => e.type === 'goal' && String(e.clubId) === String(match.awayClubId) && (graphicType === 'FT' || e.minute <= 45))
                      .map((evt) => (
                        <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', flexDirection: 'row-reverse' }}>
                          <span style={{ color: '#c8a84b', fontWeight: 700 }}>{evt.minute}'</span>
                          <span>{evt.playerName} ⚽</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* If no goals at all */}
                {events.filter(e => e.type === 'goal' && (graphicType === 'FT' || e.minute <= 45)).length === 0 && (
                  <div style={{ fontSize: 9, color: '#555', textAlign: 'center', fontStyle: 'italic', padding: '2px 0' }}>Tidak ada gol tercipta</div>
                )}
              </div>

              {/* Footer */}
              <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6, fontSize: 8, color: '#555', fontWeight: 600, marginTop: 8, width: '100%' }}>
                <span>{APP_HANDLE}</span>
              </div>
            </div>
          </>
        )}
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
                    <div style={{ fontSize: 14, color: '#0F9F9A' }}>âžœ</div>
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
                <span style={{ color: '#0F9F9A' }}>{APP_HANDLE}</span>
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
                    <span style={{ color: '#0F9F9A', fontWeight: 800 }}>âžœ</span>
                    <span style={{ fontWeight: 800, color: 'white' }}>{destClub || 'Klub Tujuan'}</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                  <span>PUBLISHED BY GOSBALL</span>
                  <span style={{ color: '#0F9F9A', letterSpacing: 0.5 }}>{APP_HANDLE}</span>
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
      const clubSlug = code ? code.toLowerCase() : 'club';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'club-logos');
      formData.append('folder', clubSlug);

      const response = await fetch('/api/uploads/logo', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Upload gagal');

      setLogo(result.data.publicUrl);
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
    flagUrl: 'https://flags.restcountries.com/v5/svg/id.svg',
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
  const [age, setAge] = useState(player.age);
  const [contractStart, setContractStart] = useState(player.contractStart);
  const [contractEnd, setContractEnd] = useState(player.contractEnd);
  const [status, setStatus] = useState<Player['status']>(player.status);
  const [availability, setAvailability] = useState<Player['availability']>(player.availability);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const selectedClub = clubs.find(c => c.id === clubId);

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
      age,
      contractStart,
      contractEnd,
      status,
      availability,
      completeness: liveCompleteness
    };
    onSave(updatedPlayer);
  };

  return (
    <div className="player-editor-root">
      <div className="player-editor-header">
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

      <div className="player-editor-layout">
      <div className="card player-editor-card">
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
            <select className="form-select" value={position} onChange={(e) => setPosition(e.target.value as Player['position'])}>
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

        <div className="player-section-title">Detail Kontrak & Status</div>
        <div className="grid-12" style={{ gap: 16 }}>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label">Umur</label>
            <input type="number" min={15} max={50} className="form-input" value={age} onChange={(e) => setAge(Number(e.target.value))} />
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as Player['status'])}>
              <option value="active">Aktif</option>
              <option value="free_agent">Free Agent</option>
              <option value="retired">Pensiun</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label">Mulai Kontrak</label>
            <input type="date" className="form-input" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label">Akhir Kontrak</label>
            <input type="date" className="form-input" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 12' }}>
            <label className="form-label">Availability</label>
            <select className="form-select" value={availability} onChange={(e) => setAvailability(e.target.value as Player['availability'])}>
              <option value="available">Tersedia</option>
              <option value="injured">Cedera</option>
              <option value="suspended">Skorsing</option>
              <option value="international_duty">Tim Nasional</option>
              <option value="doubtful">Diragukan</option>
            </select>
            <span className="form-helper">Status ini dipakai di lineup editor untuk menandai pemain yang tidak siap bermain.</span>
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
              <button type="button" onClick={() => { setFlag(''); setNationality(''); }} style={{ marginLeft: 4, fontSize: 11, color: 'var(--neutral-500)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>Hapus</button>
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
            <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--neutral-400)', transform: countryDropdownOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
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
                        <span style={{ width: 28, fontSize: 18 }}>-</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                      {nationality === item.name && <CheckCircle size={14} style={{ marginLeft: 'auto', color: 'var(--primary-600)' }} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>

        <aside className="card player-summary-card">
          <div className="player-avatar">
            {flag && flag.startsWith('http') ? (
              <img src={flag} alt={nationality || 'Negara'} />
            ) : (
              <User size={36} />
            )}
          </div>
          <div className="player-summary-name">{displayName || fullName || 'Nama Pemain'}</div>
          <div className="player-summary-meta">
            <span>{selectedClub?.shortName || selectedClub?.name || 'Tanpa Klub'}</span>
            <span>{position}</span>
            <span>#{shirtNumber || '-'}</span>
          </div>
          <div className="player-summary-completeness">
            <div className="flex justify-between align-center">
              <span>Kelengkapan</span>
              <strong>{liveCompleteness}%</strong>
            </div>
            <div className="player-summary-bar">
              <div style={{ width: `${liveCompleteness}%` }} />
            </div>
          </div>
          <div className="player-summary-list">
            <div>
              <span>Negara</span>
              <strong>{nationality || '-'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{status === 'active' ? 'Aktif' : status === 'free_agent' ? 'Free Agent' : 'Pensiun'}</strong>
            </div>
            <div>
              <span>Availability</span>
              <strong>{availability === 'available' ? 'Tersedia' : availability === 'injured' ? 'Cedera' : availability === 'suspended' ? 'Skorsing' : availability === 'international_duty' ? 'Tim Nasional' : 'Diragukan'}</strong>
            </div>
            <div>
              <span>Kontrak</span>
              <strong>{contractStart || '-'} sampai {contractEnd || '-'}</strong>
            </div>
          </div>
        </aside>
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
        <p className="page-description">Daftar rekaman perubahan data penting, riwayat editing, dan validasi publish di Gosball.</p>
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
          <p className="page-description">Kelola data kompetisi sepak bola â€” liga, piala, dan turnamen yang diikuti klub-klub dalam sistem.</p>
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
      const folderSlug = (slug || name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'competition';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'competition-logos');
      formData.append('folder', folderSlug);

      const response = await fetch('/api/uploads/logo', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Upload gagal');

      setLogoUrl(result.data.publicUrl);
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
