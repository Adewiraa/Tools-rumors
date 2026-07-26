'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Club,
  Player,
  Match,
  Rumor,
  AuditLog,
  Competition,
  INITIAL_CLUBS,
  INITIAL_PLAYERS,
  INITIAL_RUMORS,
  INITIAL_COMPETITIONS,
  calculateClubCompleteness
} from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_APP_SETTINGS, normalizeAppSettings } from '@/logic/utils';
import type { AppSettings } from '@/logic/utils';
import {
  AppUser,
  RolePermission,
  UserRole,
  ActiveMenu,
  INITIAL_USERS,
  INITIAL_ROLE_PERMISSIONS
} from '@/lib/types/auth';
import { getSessionUser } from '@/logic/authSession';
import { ThemePalette, DEFAULT_THEME_PALETTE, applyThemeToDocument } from '@/logic/colorGenerator';

export type { UserRole, ActiveMenu };

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface AppContextType {
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  rumors: Rumor[];
  setRumors: React.Dispatch<React.SetStateAction<Rumor[]>>;
  appSettings: AppSettings;
  setAppSettings: (settings: Partial<AppSettings>) => void;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  competitions: Competition[];
  setCompetitions: React.Dispatch<React.SetStateAction<Competition[]>>;

  // Users & Permissions State
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  rolePermissions: RolePermission[];
  setRolePermissions: React.Dispatch<React.SetStateAction<RolePermission[]>>;

  // Currently logged-in user (from session)
  currentUser: Omit<AppUser, 'password'> | null;
  setCurrentUser: (user: Omit<AppUser, 'password'> | null) => void;
  
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  uiState: 'default' | 'loading' | 'empty' | 'error';
  setUiState: (state: 'default' | 'loading' | 'empty' | 'error') => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  
  toast: ToastMessage | null;
  triggerToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (val: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (val: boolean) => void;
  
  logAction: (action: string, module: string, details: string) => void;
  hasPermission: (module: string, action: 'read' | 'create_edit' | 'publish' | 'delete' | 'all') => boolean;
  hasMenuAccess: (menuId: string) => boolean;

  // Realtime Color Studio Theme State
  currentTheme: ThemePalette;
  setCustomTheme: (palette: ThemePalette) => void;

  // CRUD Operations for Users & Role Permissions
  addUser: (user: Omit<AppUser, 'id'>) => Promise<boolean>;
  updateUser: (user: Partial<AppUser> & { id: string }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  saveRolePermissions: (permissions: RolePermission[]) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const RUMORS_STORAGE_KEY = 'gosball_rumors_cache';
const CLUBS_STORAGE_KEY = 'gosball_clubs_cache';
const PLAYERS_STORAGE_KEY = 'gosball_players_cache';
const MATCHES_STORAGE_KEY = 'gosball_matches_cache';
const COMPETITIONS_STORAGE_KEY = 'gosball_competitions_cache';
const APP_SETTINGS_STORAGE_KEY = 'gosball_app_settings';
const USERS_STORAGE_KEY = 'gosball_users_cache';
const PERMISSIONS_STORAGE_KEY = 'gosball_permissions_cache';
const AUDIT_LOGS_STORAGE_KEY = 'gosball_audit_logs_cache';
const SEED_AUDIT_LOG_IDS = new Set(['log-1', 'log-2', 'log-3']);

const readCachedArray = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch (error) {
    console.warn(`Cache ${key} error:`, error);
    return fallback;
  }
};

const writeCache = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Cache ${key} error:`, error);
  }
};

const sanitizeAuditLogs = (logs: AuditLog[]) => (
  logs.filter(log => !SEED_AUDIT_LOG_IDS.has(log.id))
);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clubs, setClubsState] = useState<Club[]>(INITIAL_CLUBS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rumors, setRumorsState] = useState<Rumor[]>(INITIAL_RUMORS);
  const [appSettings, setAppSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [auditLogs, setAuditLogsState] = useState<AuditLog[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(INITIAL_ROLE_PERMISSIONS);

  const [currentUser, setCurrentUserState] = useState<Omit<AppUser, 'password'> | null>(null);
  const [currentUserRole, setCurrentUserRoleState] = useState<UserRole>('Super Admin');
  const [currentTheme, setCurrentThemeState] = useState<ThemePalette>(DEFAULT_THEME_PALETTE);
  const [uiState, setUiState] = useState<'default' | 'loading' | 'empty' | 'error'>('default');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const setClubs: React.Dispatch<React.SetStateAction<Club[]>> = (value) => {
    setClubsState(prev => {
      const next = typeof value === 'function'
        ? (value as (prevState: Club[]) => Club[])(prev)
        : value;
      writeCache(CLUBS_STORAGE_KEY, next);
      return next;
    });
  };

  const setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>> = (value) => {
    setAuditLogsState(prev => {
      const nextValue = typeof value === 'function'
        ? (value as (prevState: AuditLog[]) => AuditLog[])(prev)
        : value;
      const next = sanitizeAuditLogs(nextValue);
      writeCache(AUDIT_LOGS_STORAGE_KEY, next);
      return next;
    });
  };

  // Load browser-only preferences and draft assets.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load session user (from login)
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setCurrentUserState(sessionUser);
        setCurrentUserRoleState(sessionUser.role as UserRole);
      } else {
        // Fallback: legacy role from localStorage
        const savedRole = localStorage.getItem('gosball_admin_role') as UserRole;
        if (savedRole) setCurrentUserRoleState(savedRole);
      }

      setClubs(readCachedArray(CLUBS_STORAGE_KEY, INITIAL_CLUBS));
      setPlayers(readCachedArray(PLAYERS_STORAGE_KEY, INITIAL_PLAYERS));
      setMatches(readCachedArray(MATCHES_STORAGE_KEY, []));
      setRumorsState(readCachedArray(RUMORS_STORAGE_KEY, INITIAL_RUMORS));
      setCompetitions(readCachedArray(COMPETITIONS_STORAGE_KEY, INITIAL_COMPETITIONS));
      setUsers(readCachedArray(USERS_STORAGE_KEY, INITIAL_USERS));
      setRolePermissions(readCachedArray(PERMISSIONS_STORAGE_KEY, INITIAL_ROLE_PERMISSIONS));
      setAuditLogs(readCachedArray(AUDIT_LOGS_STORAGE_KEY, []));

      const savedSettings = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          setAppSettingsState(normalizeAppSettings(JSON.parse(savedSettings)));
        } catch (e) {
          console.warn('Cache settings error:', e);
        }
      }

      const savedTheme = localStorage.getItem('gosball_custom_theme');
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme);
          setCurrentThemeState(parsed);
          applyThemeToDocument(parsed);
        } catch (e) {
          console.warn('Cache theme error:', e);
        }
      }
    }
  }, []);

  // Dynamically update browser tab favicon/icon & document title from App Settings (Master Web Logo & Name)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (appSettings.appName) {
      document.title = `${appSettings.appName} - Admin Media Sepak Bola Indonesia`;
    }

    if (appSettings.appLogoSrc) {
      const logoUrl = appSettings.appLogoSrc;

      // Update or create standard shortcut icon link tag
      let iconLink: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(iconLink);
      }
      iconLink.href = logoUrl;

      // Update or create apple-touch-icon link tag
      let appleIconLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(appleIconLink);
      }
      appleIconLink.href = logoUrl;
    }
  }, [appSettings.appName, appSettings.appLogoSrc]);

  const setCustomTheme = (palette: ThemePalette) => {
    setCurrentThemeState(palette);
    applyThemeToDocument(palette);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gosball_custom_theme', JSON.stringify(palette));
    }
  };

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUserRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gosball_admin_role', role);
    }
  };

  const setCurrentUser = (user: Omit<AppUser, 'password'> | null) => {
    setCurrentUserState(user);
    if (user) {
      setCurrentUserRoleState(user.role as UserRole);
    }
  };

  const setRumors: React.Dispatch<React.SetStateAction<Rumor[]>> = (value) => {
    setRumorsState(prev => {
      const next = typeof value === 'function'
        ? (value as (prevState: Rumor[]) => Rumor[])(prev)
        : value;

      if (typeof window !== 'undefined') {
        writeCache(RUMORS_STORAGE_KEY, next);
      }

      return next;
    });
  };

  const setAppSettings = (settings: Partial<AppSettings>) => {
    const nextSettings = normalizeAppSettings(settings);
    setAppSettingsState(nextSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    }
  };

  const triggerToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const logAction = (action: string, module: string, details: string) => {
    const actorName = currentUser?.fullName || currentUser?.username || currentUserRole;
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
      user: actorName,
      action,
      module,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);

    void fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: newLog }),
    })
      .then(async response => {
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) {
          throw new Error(json?.error || 'Gagal menyimpan audit log.');
        }
      })
      .catch(error => {
        console.warn('Audit log persisted locally only:', error);
      });
  };

  const hasPermission = (module: string, action: 'read' | 'create_edit' | 'publish' | 'delete' | 'all') => {
    if (currentUserRole === 'Super Admin') return true;

    if (module === 'Master') {
      if (currentUserRole === 'Admin Data') return action !== 'delete';
      return action === 'read';
    }

    if (module === 'Lineup Pertandingan') {
      if (currentUserRole === 'Admin Data') return action === 'read';
      if (currentUserRole === 'Match Editor') return action !== 'delete';
      if (currentUserRole === 'Reviewer') return action === 'read' || action === 'publish';
      return action === 'read';
    }

    if (module === 'Match Result') {
      if (currentUserRole === 'Admin Data') return action === 'read';
      if (currentUserRole === 'Match Editor') return action !== 'delete';
      if (currentUserRole === 'Reviewer') return action === 'read' || action === 'publish';
      return action === 'read';
    }

    if (module === 'Rumor & Transfer') {
      if (currentUserRole === 'Admin Data') return action === 'read';
      if (currentUserRole === 'Rumor Editor') return action !== 'delete';
      if (currentUserRole === 'Reviewer') return action === 'read' || action === 'publish';
      return action === 'read';
    }

    if (module === 'Audit Log') {
      return false;
    }

    return true;
  };

  const hasMenuAccess = (menuId: string): boolean => {
    if (currentUserRole === 'Super Admin') return true;
    if (menuId === 'media-ads' && currentUserRole === 'Admin Data') return true;
    const perm = rolePermissions.find(p => p.role === currentUserRole);
    if (!perm) return true; // fallback default open
    if (
      menuId === 'media-ads' &&
      perm.allowedMenus.some(menu => menu === 'clubs' || menu === 'players' || menu === 'competitions')
    ) {
      return true;
    }
    return perm.allowedMenus.includes(menuId as ActiveMenu);
  };

  // User CRUD Operations
  const addUser = async (newUser: Omit<AppUser, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menambahkan user baru.');
      }
      const created: AppUser = json.data;
      setUsers(prev => {
        const next = [...prev, created];
        if (typeof window !== 'undefined') localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      logAction('CREATE_USER', 'Manajemen User', `Menambahkan user baru ${created.username} (${created.role})`);
      triggerToast(`User ${created.username} berhasil dibuat!`, 'success');
      return true;
    } catch (err: any) {
      console.warn('API addUser fallback to local state:', err);
      const fallbackUser: AppUser = {
        id: 'usr-' + Date.now(),
        ...newUser,
      };
      setUsers(prev => {
        const next = [...prev, fallbackUser];
        if (typeof window !== 'undefined') localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      logAction('CREATE_USER', 'Manajemen User', `Menambahkan user baru ${fallbackUser.username} (${fallbackUser.role})`);
      triggerToast(`User ${fallbackUser.username} berhasil dibuat (Lokal)!`, 'success');
      return true;
    }
  };

  const updateUser = async (updatedUser: Partial<AppUser> & { id: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengupdate user.');
      }
      const updated: AppUser = json.data;
      setUsers(prev => {
        const next = prev.map(u => u.id === updated.id ? updated : u);
        if (typeof window !== 'undefined') localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      logAction('UPDATE_USER', 'Manajemen User', `Mengubah data user ${updated.username}`);
      triggerToast(`Data user ${updated.username} berhasil diperbarui!`, 'success');
      return true;
    } catch (err: any) {
      console.warn('API updateUser fallback to local state:', err);
      setUsers(prev => {
        const next = prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u);
        if (typeof window !== 'undefined') localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      logAction('UPDATE_USER', 'Manajemen User', `Mengubah data user ID ${updatedUser.id}`);
      triggerToast('Data user berhasil diperbarui (Lokal)!', 'success');
      return true;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus user.');
      }
      setUsers(prev => {
        const next = prev.filter(u => u.id !== id);
        if (typeof window !== 'undefined') localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      logAction('DELETE_USER', 'Manajemen User', `Menghapus user ID ${id}`);
      triggerToast('User berhasil dihapus!', 'success');
      return true;
    } catch (err: any) {
      console.warn('API deleteUser fallback to local state:', err);
      setUsers(prev => {
        const next = prev.filter(u => u.id !== id);
        if (typeof window !== 'undefined') localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      logAction('DELETE_USER', 'Manajemen User', `Menghapus user ID ${id}`);
      triggerToast('User berhasil dihapus (Lokal)!', 'success');
      return true;
    }
  };

  const saveRolePermissions = async (newPermissions: RolePermission[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPermissions }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan hak akses ke database.');
      }
      const saved: RolePermission[] = json.data;
      setRolePermissions(saved);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(saved));
      }
      logAction('UPDATE_PERMISSIONS', 'Manajemen Hak Akses', 'Memperbarui matriks hak akses menu');
      triggerToast('Matriks Hak Akses berhasil disimpan!', 'success');
      return true;
    } catch (err: any) {
      console.warn('API saveRolePermissions fallback to local state:', err);
      setRolePermissions(newPermissions);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(newPermissions));
      }
      logAction('UPDATE_PERMISSIONS', 'Manajemen Hak Akses', 'Memperbarui matriks hak akses menu (Lokal)');
      triggerToast('Matriks Hak Akses disimpan di browser!', 'success');
      return true;
    }
  };

  // Fetch Supabase data on mount
  useEffect(() => {
    const toRegulationNumber = (value: any, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const mapClubFromSupabase = (club: any): Club => {
      const mappedClub: Club = {
        id: club.id,
        name: club.name || '',
        shortName: club.shortName || club.short_name || club.name || '',
        code: club.code || club.slug?.toUpperCase?.()?.slice(0, 3) || club.short_name?.toUpperCase?.()?.slice(0, 3) || '',
        country: club.country || 'Indonesia',
        city: club.city || '',
        stadium: club.stadium || '',
        founded: Number(club.founded) || 2026,
        homeColor: club.homeColor || club.home_color || club.primary_color || '#66756A',
        awayColor: club.awayColor || club.away_color || club.secondary_color || '#E2E8F0',
        thirdColor: club.thirdColor || club.third_color || '#111827',
        logoUrl: club.logoUrl || club.logo_url || club.logo_public_url || club.logo || '',
        coach: club.coach || '',
        activePlayersCount: Number(club.activePlayersCount || club.active_players_count) || 0,
        completeness: 0,
        status: club.status || 'active',
        competitionIds: Array.isArray(club.competitionIds)
          ? club.competitionIds
          : Array.isArray(club.competition_ids)
            ? club.competition_ids
            : [],
      };
      mappedClub.completeness = Number(club.completeness) || calculateClubCompleteness(mappedClub);
      return mappedClub;
    };

    const mapCompetitionFromSupabase = (competition: any): Competition => ({
      id: competition.id,
      name: competition.name || '',
      shortName: competition.shortName || competition.short_name || '',
      slug: competition.slug || '',
      type: competition.type || 'league',
      country: competition.country || 'Indonesia',
      logoUrl: competition.logoUrl || competition.logo_url || competition.logo_public_url || '',
      season: competition.season || '',
      isActive: competition.isActive !== undefined ? competition.isActive : competition.is_active !== undefined ? competition.is_active : true,
      foreignRegulationFree: competition.foreignRegulationFree !== undefined ? competition.foreignRegulationFree : Boolean(competition.foreign_regulation_free),
      maxForeignStarters: toRegulationNumber(competition.maxForeignStarters ?? competition.max_foreign_starters, 7),
      maxForeignMatchday: toRegulationNumber(competition.maxForeignMatchday ?? competition.max_foreign_matchday, 9),
      maxForeignSquad: toRegulationNumber(competition.maxForeignSquad ?? competition.max_foreign_squad, 11),
      minLocalStarters: toRegulationNumber(competition.minLocalStarters ?? competition.min_local_starters, 0),
      minLocalMatchday: toRegulationNumber(competition.minLocalMatchday ?? competition.min_local_matchday, 0),
    });

    async function loadSupabaseData() {
      const fetchJson = async (url: string) => {
        const response = await fetch(url, { cache: 'no-store' });
        return response.json();
      };

      const [
        clubsResult,
        compResult,
        playerResult,
        matchResult,
        rumorResult,
        usersResult,
        permResult,
        settingsResult,
        auditResult,
      ] = await Promise.allSettled([
        supabase.from('clubs').select('*'),
        supabase.from('competitions').select('*'),
        fetchJson('/api/players'),
        fetchJson('/api/matches'),
        fetchJson('/api/rumors'),
        fetchJson('/api/users'),
        fetchJson('/api/permissions'),
        fetchJson('/api/settings'),
        fetchJson('/api/audit-logs'),
      ]);

      let successCount = 0;

      if (clubsResult.status === 'fulfilled' && !clubsResult.value.error && clubsResult.value.data) {
        const sortedClubs = clubsResult.value.data
          .map(mapClubFromSupabase)
          .sort((a, b) => a.name.localeCompare(b.name));
        setClubs(sortedClubs);
        writeCache(CLUBS_STORAGE_KEY, sortedClubs);
        successCount += 1;
      } else {
        console.warn('Gagal load clubs dari Supabase, pakai cache lokal:', clubsResult);
      }

      if (compResult.status === 'fulfilled' && !compResult.value.error && compResult.value.data) {
        const sortedComp = compResult.value.data
          .map(mapCompetitionFromSupabase)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCompetitions(sortedComp);
        writeCache(COMPETITIONS_STORAGE_KEY, sortedComp);
        successCount += 1;
      } else {
        console.warn('Gagal load competitions dari Supabase, pakai cache lokal:', compResult);
      }

      if (playerResult.status === 'fulfilled' && playerResult.value.success && Array.isArray(playerResult.value.data) && playerResult.value.data.length > 0) {
        setPlayers(playerResult.value.data);
        writeCache(PLAYERS_STORAGE_KEY, playerResult.value.data);
        successCount += 1;
      } else {
        console.warn('Gagal load players dari Supabase, pakai cache lokal:', playerResult);
      }

      if (matchResult.status === 'fulfilled' && matchResult.value.success && Array.isArray(matchResult.value.data)) {
        setMatches(matchResult.value.data);
        writeCache(MATCHES_STORAGE_KEY, matchResult.value.data);
        successCount += 1;
      } else {
        console.warn('Gagal load matches dari Supabase, pakai cache lokal:', matchResult);
      }

      if (rumorResult.status === 'fulfilled' && rumorResult.value.success && Array.isArray(rumorResult.value.data)) {
        setRumorsState(rumorResult.value.data);
        writeCache(RUMORS_STORAGE_KEY, rumorResult.value.data);
        successCount += 1;
      } else {
        console.warn('Gagal load rumors dari Supabase, pakai cache lokal:', rumorResult);
      }

      if (usersResult.status === 'fulfilled' && usersResult.value.success && Array.isArray(usersResult.value.data) && usersResult.value.data.length > 0) {
        setUsers(usersResult.value.data);
        writeCache(USERS_STORAGE_KEY, usersResult.value.data);
        successCount += 1;
      } else {
        console.warn('Gagal load users dari Supabase, pakai cache lokal:', usersResult);
      }

      if (permResult.status === 'fulfilled' && permResult.value.success && Array.isArray(permResult.value.data) && permResult.value.data.length > 0) {
        setRolePermissions(permResult.value.data);
        writeCache(PERMISSIONS_STORAGE_KEY, permResult.value.data);
        successCount += 1;
      } else {
        console.warn('Gagal load permissions dari Supabase, pakai cache lokal:', permResult);
      }

      if (settingsResult.status === 'fulfilled' && settingsResult.value.success && settingsResult.value.data) {
        setAppSettings(settingsResult.value.data);
        successCount += 1;
      } else {
        console.warn('Gagal load pengaturan aplikasi, pakai cache lokal:', settingsResult);
      }

      if (auditResult.status === 'fulfilled' && auditResult.value.success && Array.isArray(auditResult.value.data)) {
        setAuditLogs(auditResult.value.data);
        successCount += 1;
      } else {
        console.warn('Gagal load audit log dari Supabase, pakai cache lokal:', auditResult);
      }

      setIsOffline(successCount === 0);
      setUiState('default');

      if (successCount === 0) {
        triggerToast('Data online belum tersambung. Aplikasi memakai cache lokal.', 'warning');
      }
    }

    loadSupabaseData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        clubs,
        setClubs,
        players,
        setPlayers,
        matches,
        setMatches,
        rumors,
        setRumors,
        appSettings,
        setAppSettings,
        auditLogs,
        setAuditLogs,
        competitions,
        setCompetitions,
        
        users,
        setUsers,
        rolePermissions,
        setRolePermissions,

        currentUser,
        setCurrentUser,

        currentUserRole,
        setCurrentUserRole,
        uiState,
        setUiState,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        isOffline,
        setIsOffline,
        
        toast,
        triggerToast,
        
        globalSearchOpen,
        setGlobalSearchOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileDrawerOpen,
        setMobileDrawerOpen,
        
        logAction,
        hasPermission,
        hasMenuAccess,

        currentTheme,
        setCustomTheme,

        addUser,
        updateUser,
        deleteUser,
        saveRolePermissions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
