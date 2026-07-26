export type UserRole = 'Super Admin' | 'Admin Data' | 'Match Editor' | 'Rumor Editor' | 'Reviewer';

export type ActiveMenu =
  | 'dashboard'
  | 'schedule'
  | 'lineups'
  | 'results'
  | 'rumors'
  | 'clubs'
  | 'players'
  | 'competitions'
  | 'media-ads'
  | 'users'
  | 'permissions'
  | 'logs'
  | 'settings';

export interface MediaTenant {
  id: string;
  name: string;
  logoSrc: string;
  subtitle: string;
  handle: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatarUrl?: string;
  customTheme?: unknown;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  role: UserRole;
  allowedMenus: ActiveMenu[];
  updatedAt?: string;
}

export const ALL_MENUS: { id: ActiveMenu; label: string; category: string }[] = [
  { id: 'dashboard', label: 'Dashboard', category: 'Menu Utama' },
  { id: 'schedule', label: 'Jadwal Pertandingan', category: 'Pertandingan' },
  { id: 'lineups', label: 'Lineup Tim', category: 'Pertandingan' },
  { id: 'results', label: 'Hasil Pertandingan', category: 'Pertandingan' },
  { id: 'rumors', label: 'Rumor & Transfer', category: 'Editorial' },
  { id: 'clubs', label: 'Master Klub', category: 'Master Data' },
  { id: 'players', label: 'Master Pemain', category: 'Master Data' },
  { id: 'competitions', label: 'Master Kompetisi', category: 'Master Data' },
  { id: 'media-ads', label: 'Master Iklan', category: 'Master Data' },
  { id: 'users', label: 'Manajemen User', category: 'Sistem' },
  { id: 'permissions', label: 'Manajemen Hak Akses', category: 'Sistem' },
  { id: 'logs', label: 'Audit Log', category: 'Sistem' },
  { id: 'settings', label: 'Pengaturan', category: 'Sistem' },
];

export const INITIAL_ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'Super Admin',
    allowedMenus: ['dashboard', 'schedule', 'lineups', 'results', 'rumors', 'clubs', 'players', 'competitions', 'media-ads', 'users', 'permissions', 'logs', 'settings'],
  },
  {
    role: 'Admin Data',
    allowedMenus: ['dashboard', 'schedule', 'clubs', 'players', 'competitions', 'media-ads', 'logs', 'settings'],
  },
  {
    role: 'Match Editor',
    allowedMenus: ['dashboard', 'schedule', 'lineups', 'results', 'settings'],
  },
  {
    role: 'Rumor Editor',
    allowedMenus: ['dashboard', 'rumors', 'settings'],
  },
  {
    role: 'Reviewer',
    allowedMenus: ['dashboard', 'schedule', 'lineups', 'results', 'rumors', 'logs', 'settings'],
  },
];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-superadmin',
    username: 'admin',
    password: 'admin123',
    fullName: 'Super Admin Gosball',
    role: 'Super Admin',
    status: 'active',
  },
  {
    id: 'usr-editor1',
    username: 'match_editor',
    password: 'editor123',
    fullName: 'Ahmad Editor Match',
    role: 'Match Editor',
    status: 'active',
  },
  {
    id: 'usr-rumoreditor',
    username: 'rumor_editor',
    password: 'rumor123',
    fullName: 'Budi Rumor Editor',
    role: 'Rumor Editor',
    status: 'active',
  },
  {
    id: 'usr-admindata',
    username: 'data_admin',
    password: 'data123',
    fullName: 'Citra Data Admin',
    role: 'Admin Data',
    status: 'active',
  },
];
