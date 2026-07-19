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

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rumors, setRumors] = useState<Rumor[]>(INITIAL_RUMORS);
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

  // Load user role from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('gosball_admin_role') as UserRole;
      if (savedRole) {
        setCurrentUserRoleState(savedRole);
      }
    }
  }, []);

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUserRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gosball_admin_role', role);
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

        // 3. Fetch Players
        const { data: playersData, error: playersError } = await supabase.from('players').select('*');
        if (playersError) throw playersError;
        if (playersData && playersData.length > 0) {
          const calculatePlayerCompleteness = (player: any) => {
            const fields = [
              { val: player.full_name, weight: 35 },
              { val: player.display_name, weight: 25 },
              { val: player.club_id, weight: 15 },
              { val: player.position, weight: 15 },
              { val: player.shirt_number, weight: 10 },
            ];
            let filled = 0;
            fields.forEach(f => {
              if (f.val !== undefined && f.val !== null && f.val !== '') filled += f.weight;
            });
            return filled;
          };
          const mappedPlayers: Player[] = playersData.map((p: any) => {
            const mappedPlayer: Player = {
              id: p.id,
              fullName: p.full_name,
              displayName: p.display_name,
              clubId: p.club_id || '',
              clubName: p.club_name || '',
              position: p.position || 'Defender',
              shirtNumber: Number(p.shirt_number) || 0,
              nationality: p.nationality || 'Indonesia',
              flagUrl: p.flag_url || 'https://flags.restcountries.com/v5/svg/id.svg',
              age: Number(p.age) || 20,
              contractStart: p.contract_start || '',
              contractEnd: p.contract_end || '',
              status: p.status || 'active',
              availability: p.availability || 'available',
              completeness: 0
            };
            mappedPlayer.completeness = calculatePlayerCompleteness(p);
            return mappedPlayer;
          });
          setPlayers(mappedPlayers);
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
