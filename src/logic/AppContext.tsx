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
  INITIAL_AUDIT_LOGS,
  INITIAL_COMPETITIONS,
  calculateClubCompleteness
} from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_APP_SETTINGS, normalizeAppSettings } from '@/logic/utils';
import type { AppSettings } from '@/logic/utils';

export type UserRole = 'Super Admin' | 'Admin Data' | 'Match Editor' | 'Rumor Editor' | 'Reviewer';
export type ActiveMenu = 'dashboard' | 'schedule' | 'lineups' | 'results' | 'rumors' | 'clubs' | 'players' | 'competitions' | 'logs' | 'settings';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const RUMORS_STORAGE_KEY = 'gosball_rumors_cache';
const APP_SETTINGS_STORAGE_KEY = 'gosball_app_settings';

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rumors, setRumorsState] = useState<Rumor[]>(INITIAL_RUMORS);
  const [appSettings, setAppSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  
  const [currentUserRole, setCurrentUserRoleState] = useState<UserRole>('Super Admin');
  const [uiState, setUiState] = useState<'default' | 'loading' | 'empty' | 'error'>('default');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Load browser-only preferences and draft assets.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('gosball_admin_role') as UserRole;
      if (savedRole) {
        setCurrentUserRoleState(savedRole);
      }

      const savedRumors = localStorage.getItem(RUMORS_STORAGE_KEY);
      if (savedRumors) {
        try {
          const parsedRumors = JSON.parse(savedRumors);
          if (Array.isArray(parsedRumors)) {
            setRumorsState(parsedRumors);
          }
        } catch (error) {
          console.warn('Cache rumor tidak bisa dibaca:', error);
        }
      }

      const savedSettings = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          setAppSettingsState(normalizeAppSettings(JSON.parse(savedSettings)));
        } catch (error) {
          console.warn('Cache pengaturan aplikasi tidak bisa dibaca:', error);
        }
      }
    }
  }, []);

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUserRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gosball_admin_role', role);
    }
  };

  const setRumors: React.Dispatch<React.SetStateAction<Rumor[]>> = (value) => {
    setRumorsState(prev => {
      const next = typeof value === 'function'
        ? (value as (prevState: Rumor[]) => Rumor[])(prev)
        : value;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(RUMORS_STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
          console.warn('Cache rumor tidak bisa disimpan:', error);
        }
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
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
      user: currentUserRole,
      action,
      module,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
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

  // Fetch Supabase data on mount
  useEffect(() => {
    const mapClubFromSupabase = (club: any): Club => {
      const mappedClub: Club = {
        id: club.id,
        name: club.name || '',
        shortName: club.shortName || club.short_name || club.name || '',
        code: club.code || club.slug?.toUpperCase?.()?.slice(0, 3) || club.short_name?.toUpperCase?.()?.slice(0, 3) || '',
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
    });

    async function loadSupabaseData() {
      try {
        setUiState('loading');
        
        // 1. Fetch Clubs
        const { data: clubsData, error: clubsError } = await supabase.from('clubs').select('*');
        if (clubsError) throw clubsError;
        if (clubsData) {
          const sortedClubs = clubsData
            .map(mapClubFromSupabase)
            .sort((a, b) => a.name.localeCompare(b.name));
          setClubs(sortedClubs);
        }
        
        // 2. Fetch Competitions
        const { data: compData, error: compError } = await supabase.from('competitions').select('*');
        if (compError) throw compError;
        if (compData) {
          const sortedComp = compData
            .map(mapCompetitionFromSupabase)
            .sort((a, b) => a.name.localeCompare(b.name));
          setCompetitions(sortedComp);
        }

        // 3. Fetch Players via API route so roster and club-season relations are mapped consistently
        try {
          const playerRes = await fetch('/api/players');
          const playerJson = await playerRes.json();
          if (playerJson.success && playerJson.data && playerJson.data.length > 0) {
            setPlayers(playerJson.data);
          }
        } catch (playerErr) {
          console.warn('Gagal load players dari Supabase, pakai data lokal:', playerErr);
        }

        // 4. Fetch Matches via API route
        try {
          const matchRes = await fetch('/api/matches');
          const matchJson = await matchRes.json();
          if (matchJson.success && matchJson.data && matchJson.data.length > 0) {
            setMatches(matchJson.data);
          }
        } catch (matchErr) {
          console.warn('Gagal load matches dari Supabase, pakai data lokal:', matchErr);
        }

        // 5. Fetch app identity if the settings table already exists.
        try {
          const settingsRes = await fetch('/api/settings');
          const settingsJson = await settingsRes.json();
          if (settingsJson.success && settingsJson.data) {
            setAppSettings(settingsJson.data);
          }
        } catch (settingsErr) {
          console.warn('Gagal load pengaturan aplikasi, pakai cache lokal:', settingsErr);
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
        hasPermission
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
