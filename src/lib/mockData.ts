export interface Competition {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  type: 'league' | 'cup' | 'friendly';
  country: string;
  logoUrl: string;
  season: string;
  isActive: boolean;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  code: string;
  city: string;
  stadium: string;
  founded: number;
  homeColor: string;
  awayColor: string;
  thirdColor: string;
  logoUrl: string;
  coach: string;
  activePlayersCount: number;
  completeness: number; // 0 - 100
  status: 'active' | 'inactive';
  competitionIds?: string[]; // relasi ke kompetisi yang diikuti
}

// Calculate club completeness based on which fields are filled
export function calculateClubCompleteness(club: Partial<Club>): number {
  const fields: { key: keyof Club; weight: number }[] = [
    { key: 'name', weight: 15 },
    { key: 'shortName', weight: 10 },
    { key: 'code', weight: 10 },
    { key: 'city', weight: 10 },
    { key: 'stadium', weight: 10 },
    { key: 'coach', weight: 10 },
    { key: 'logoUrl', weight: 15 },
    { key: 'homeColor', weight: 7 },
    { key: 'awayColor', weight: 7 },
    { key: 'thirdColor', weight: 6 },
  ];

  let totalWeight = 0;
  let filledWeight = 0;

  for (const field of fields) {
    totalWeight += field.weight;
    const value = club[field.key];
    if (value !== undefined && value !== null && value !== '' && value !== '⚽') {
      filledWeight += field.weight;
    }
  }

  return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
}

// Calculate player completeness based on which fields are filled
export function calculatePlayerCompleteness(player: Partial<Player>): number {
  const fields: { key: keyof Player; weight: number }[] = [
    { key: 'fullName', weight: 35 },
    { key: 'displayName', weight: 25 },
    { key: 'clubId', weight: 15 },
    { key: 'position', weight: 15 },
    { key: 'shirtNumber', weight: 10 },
  ];

  let totalWeight = 0;
  let filledWeight = 0;

  for (const field of fields) {
    totalWeight += field.weight;
    const value = player[field.key];
    if (value !== undefined && value !== null && value !== '') {
      filledWeight += field.weight;
    }
  }

  return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
}

export interface Player {
  id: string;
  fullName: string;
  displayName: string;
  clubId: string;
  clubName: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  shirtNumber: number;
  nationality: string;
  flagUrl: string;
  age: number;
  contractStart: string;
  contractEnd: string;
  status: 'active' | 'retired' | 'free_agent';
  availability: 'available' | 'injured' | 'suspended' | 'international_duty' | 'doubtful';
  completeness: number; // 0 - 100
}

export interface Match {
  id: string;
  homeClubId: string;
  homeClubName: string;
  homeLogo: string;
  awayClubId: string;
  awayClubName: string;
  awayLogo: string;
  competition: string;
  season: string;
  kickoff: string; // ISO date string
  venue: string;
  status: 'Scheduled' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled';
  homeScore?: number;
  awayScore?: number;
  halfTimeHomeScore?: number;
  halfTimeAwayScore?: number;
  lineupStatus: 'Draft' | 'Needs Review' | 'Complete';
  publicationStatus: 'Draft' | 'Scheduled' | 'Published' | 'Archived';
  editor: string;
  lastUpdated: string;
}

export interface Rumor {
  id: string;
  headline: string;
  player: string;
  fromClub: string;
  destinationClub: string;
  type: 'rumor' | 'negosiasi' | 'resmi' | 'perpanjangan' | 'loan';
  reliabilityTier: 'A' | 'B' | 'C' | 'D';
  sourceName: string;
  sourceUrl: string;
  publicationStatus: 'Draft' | 'Review' | 'Scheduled' | 'Published';
  transferStatus: 'Rumor' | 'Advanced Talks' | 'Here We Go';
  probability: number; // percentage 0 - 100
  shortSummary: string;
  articleBody: string;
  author: string;
  publishDate?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: 'comp-1',
    name: 'Liga Nusantara Utama',
    shortName: 'LNU',
    slug: 'liga-nusantara-utama',
    type: 'league',
    country: 'Indonesia',
    logoUrl: '',
    season: '2026/27',
    isActive: true,
  },
  {
    id: 'comp-2',
    name: 'Piala Nusantara',
    shortName: 'PN',
    slug: 'piala-nusantara',
    type: 'cup',
    country: 'Indonesia',
    logoUrl: '',
    season: '2026',
    isActive: true,
  },
  {
    id: 'comp-3',
    name: 'Liga Nusantara 2',
    shortName: 'LN2',
    slug: 'liga-nusantara-2',
    type: 'league',
    country: 'Indonesia',
    logoUrl: '',
    season: '2026/27',
    isActive: true,
  },
  {
    id: 'comp-4',
    name: 'Piala Super Nusantara',
    shortName: 'PSN',
    slug: 'piala-super-nusantara',
    type: 'cup',
    country: 'Indonesia',
    logoUrl: '',
    season: '2026',
    isActive: false,
  },
  {
    id: 'comp-5',
    name: 'AFC Champions League',
    shortName: 'AFCCL',
    slug: 'afc-champions-league',
    type: 'league',
    country: 'Asia',
    logoUrl: '',
    season: '2026/27',
    isActive: true,
  },
];

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-1',
    name: 'Jakarta Garuda FC',
    shortName: 'Jakarta Garuda',
    code: 'JGF',
    city: 'Jakarta',
    stadium: 'Stadion Utama Nusantara',
    founded: 1928,
    homeColor: '#1B365D',
    awayColor: '#E2E8F0',
    thirdColor: '#C8A96E',
    logoUrl: '🦅',
    coach: 'Bambang Pamungkas',
    activePlayersCount: 26,
    completeness: 95,
    status: 'active',
    competitionIds: ['comp-1', 'comp-2', 'comp-5'],
  },
  {
    id: 'club-2',
    name: 'Surabaya Samudra FC',
    shortName: 'Surabaya Samudra',
    code: 'SSF',
    city: 'Surabaya',
    stadium: 'Stadion Gelora Samudra',
    founded: 1927,
    homeColor: '#0F52BA',
    awayColor: '#FFFFFF',
    thirdColor: '#222222',
    logoUrl: '🦈',
    coach: 'Aji Santoso',
    activePlayersCount: 24,
    completeness: 90,
    status: 'active',
    competitionIds: ['comp-1', 'comp-2'],
  },
  {
    id: 'club-3',
    name: 'Bandung Cakra FC',
    shortName: 'Bandung Cakra',
    code: 'BCF',
    city: 'Bandung',
    stadium: 'Stadion Gelora Cakra',
    founded: 1933,
    homeColor: '#004B87',
    awayColor: '#FFCD00',
    thirdColor: '#FFFFFF',
    logoUrl: '🐯',
    coach: 'Bojan Hodak',
    activePlayersCount: 28,
    completeness: 85,
    status: 'active',
    competitionIds: ['comp-1', 'comp-2'],
  },
  {
    id: 'club-4',
    name: 'Bali Dewata FC',
    shortName: 'Bali Dewata',
    code: 'BDF',
    city: 'Gianyar',
    stadium: 'Stadion Kapten Dewata',
    founded: 2015,
    homeColor: '#C8102E',
    awayColor: '#000000',
    thirdColor: '#FAFAFA',
    logoUrl: '🔱',
    coach: 'Stefano Cugurra',
    activePlayersCount: 25,
    completeness: 80,
    status: 'active',
    competitionIds: ['comp-1'],
  },
  {
    id: 'club-5',
    name: 'PSM Phinisi FC',
    shortName: 'PSM Phinisi',
    code: 'PPF',
    city: 'Makassar',
    stadium: 'Stadion Gelora Phinisi',
    founded: 1915,
    homeColor: '#800000',
    awayColor: '#D4AF37',
    thirdColor: '',
    logoUrl: '⛵',
    coach: 'Bernardo Tavares',
    activePlayersCount: 23,
    completeness: 75,
    status: 'active',
    competitionIds: ['comp-1', 'comp-2'],
  }
];

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'player-1',
    fullName: 'Ardi Pratama',
    displayName: 'A. Pratama',
    clubId: 'club-3',
    clubName: 'Bandung Cakra FC',
    position: 'Forward',
    shirtNumber: 9,
    nationality: 'Indonesia',
    flagUrl: '🇮🇩',
    age: 23,
    contractStart: '2024-01-01',
    contractEnd: '2027-12-31',
    status: 'active',
    availability: 'available',
    completeness: 95,
  },
  {
    id: 'player-2',
    fullName: 'Rizky Ridho',
    displayName: 'R. Ridho',
    clubId: 'club-1',
    clubName: 'Jakarta Garuda FC',
    position: 'Defender',
    shirtNumber: 5,
    nationality: 'Indonesia',
    flagUrl: '🇮🇩',
    age: 24,
    contractStart: '2023-05-01',
    contractEnd: '2026-05-31',
    status: 'active',
    availability: 'available',
    completeness: 100,
  },
  {
    id: 'player-3',
    fullName: 'Marc Klok',
    displayName: 'M. Klok',
    clubId: 'club-3',
    clubName: 'Bandung Cakra FC',
    position: 'Midfielder',
    shirtNumber: 23,
    nationality: 'Indonesia',
    flagUrl: '🇮🇩',
    age: 32,
    contractStart: '2021-06-01',
    contractEnd: '2025-12-31',
    status: 'active',
    availability: 'injured',
    completeness: 90,
  },
  {
    id: 'player-4',
    fullName: 'Bruno Silva',
    displayName: 'B. Silva',
    clubId: 'club-2',
    clubName: 'Surabaya Samudra FC',
    position: 'Forward',
    shirtNumber: 10,
    nationality: 'Brazil',
    flagUrl: '🇧🇷',
    age: 29,
    contractStart: '2024-07-01',
    contractEnd: '2026-06-30',
    status: 'active',
    availability: 'available',
    completeness: 85,
  },
  {
    id: 'player-5',
    fullName: 'Andritany Ardhiyasa',
    displayName: 'Andritany',
    clubId: 'club-1',
    clubName: 'Jakarta Garuda FC',
    position: 'Goalkeeper',
    shirtNumber: 26,
    nationality: 'Indonesia',
    flagUrl: '🇮🇩',
    age: 34,
    contractStart: '2019-01-01',
    contractEnd: '2026-12-31',
    status: 'active',
    availability: 'available',
    completeness: 90,
  },
  {
    id: 'player-6',
    fullName: 'Witan Sulaeman',
    displayName: 'Witan',
    clubId: 'club-1',
    clubName: 'Jakarta Garuda FC',
    position: 'Midfielder',
    shirtNumber: 8,
    nationality: 'Indonesia',
    flagUrl: '🇮🇩',
    age: 24,
    contractStart: '2023-01-01',
    contractEnd: '2026-12-31',
    status: 'active',
    availability: 'available',
    completeness: 95,
  },
  {
    id: 'player-7',
    fullName: 'Gustavo Almeida',
    displayName: 'G. Almeida',
    clubId: 'club-1',
    clubName: 'Jakarta Garuda FC',
    position: 'Forward',
    shirtNumber: 70,
    nationality: 'Brazil',
    flagUrl: '🇧🇷',
    age: 27,
    contractStart: '2024-01-01',
    contractEnd: '2025-12-31',
    status: 'active',
    availability: 'available',
    completeness: 85,
  },
  {
    id: 'player-8',
    fullName: 'Yuran Fernandes',
    displayName: 'Y. Fernandes',
    clubId: 'club-5',
    clubName: 'PSM Phinisi FC',
    position: 'Defender',
    shirtNumber: 4,
    nationality: 'Cape Verde',
    flagUrl: '🇨🇻',
    age: 31,
    contractStart: '2022-06-01',
    contractEnd: '2026-06-30',
    status: 'active',
    availability: 'available',
    completeness: 90,
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-1',
    homeClubId: 'club-1',
    homeClubName: 'Jakarta Garuda FC',
    homeLogo: '🦅',
    awayClubId: 'club-2',
    awayClubName: 'Surabaya Samudra FC',
    awayLogo: '🦈',
    competition: 'Liga Nusantara Utama 2026/27',
    season: '2026/27',
    kickoff: '2026-07-18T12:30:00Z',
    venue: 'Stadion Merdeka Raya',
    status: 'Scheduled',
    lineupStatus: 'Draft',
    publicationStatus: 'Draft',
    editor: 'Match Editor A',
    lastUpdated: '2 jam yang lalu',
  },
  {
    id: 'match-2',
    homeClubId: 'club-3',
    homeClubName: 'Bandung Cakra FC',
    homeLogo: '🐯',
    awayClubId: 'club-4',
    awayClubName: 'Bali Dewata FC',
    awayLogo: '🔱',
    competition: 'Liga Nusantara Utama 2026/27',
    season: '2026/27',
    kickoff: '2026-07-13T12:00:00Z',
    venue: 'Stadion Gelora Cakra',
    status: 'Live',
    homeScore: 2,
    awayScore: 1,
    halfTimeHomeScore: 1,
    halfTimeAwayScore: 0,
    lineupStatus: 'Complete',
    publicationStatus: 'Published',
    editor: 'Admin Data',
    lastUpdated: '1 menit yang lalu',
  },
  {
    id: 'match-3',
    homeClubId: 'club-5',
    homeClubName: 'PSM Phinisi FC',
    homeLogo: '⛵',
    awayClubId: 'club-1',
    awayClubName: 'Jakarta Garuda FC',
    awayLogo: '🦅',
    competition: 'Liga Nusantara Utama 2026/27',
    season: '2026/27',
    kickoff: '2026-07-10T12:30:00Z',
    venue: 'Stadion Gelora Phinisi',
    status: 'Finished',
    homeScore: 0,
    awayScore: 2,
    halfTimeHomeScore: 0,
    halfTimeAwayScore: 1,
    lineupStatus: 'Complete',
    publicationStatus: 'Published',
    editor: 'Super Admin',
    lastUpdated: '3 hari yang lalu',
  }
];

export const INITIAL_RUMORS: Rumor[] = [
  {
    id: 'rumor-1',
    headline: 'Jakarta Garuda FC Memantau Penyerang Muda Ardi Pratama',
    player: 'Ardi Pratama',
    fromClub: 'Bandung Cakra FC',
    destinationClub: 'Jakarta Garuda FC',
    type: 'rumor',
    reliabilityTier: 'B',
    sourceName: 'Bola Nusantara',
    sourceUrl: 'https://bolanusantara.example.com',
    publicationStatus: 'Draft',
    transferStatus: 'Rumor',
    probability: 65,
    shortSummary: 'Jakarta Garuda FC dikabarkan sangat tertarik untuk mendatangkan Ardi Pratama pada bursa transfer paruh musim ini untuk memperkuat lini serang mereka.',
    articleBody: 'Ardi Pratama, striker muda berbakat dari Bandung Cakra FC, telah menjadi target utama radar transfer Jakarta Garuda FC. Tim pencari bakat Garuda FC dilaporkan telah memantau penampilan Ardi dalam 5 pertandingan terakhir. Bandung Cakra FC siap melepas sang pemain jika tawaran transfer memenuhi klausul pelepasan senilai Rp 5 Miliar.',
    author: 'Rumor Editor X',
  },
  {
    id: 'rumor-2',
    headline: 'Here We Go! Bruno Silva Sepakat Gabung Surabaya Samudra FC',
    player: 'Bruno Silva',
    fromClub: 'Free Agent',
    destinationClub: 'Surabaya Samudra FC',
    type: 'resmi',
    reliabilityTier: 'A',
    sourceName: 'Transfermarkt Indo',
    sourceUrl: 'https://transfermarkt.example.com',
    publicationStatus: 'Published',
    transferStatus: 'Here We Go',
    probability: 100,
    shortSummary: 'Kesepakatan penuh telah dicapai. Striker asal Brazil Bruno Silva akan menandatangani kontrak 2 tahun bersama Surabaya Samudra FC.',
    articleBody: 'Negosiasi intens antara perwakilan Bruno Silva dan manajemen Surabaya Samudra FC akhirnya menemui titik terang. Pemain berusia 29 tahun itu telah setuju dengan semua poin personal kontrak dan akan segera menjalani tes medis di Surabaya.',
    author: 'Super Admin',
    publishDate: '13 Jul 2026, 15:45 WIB',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '13 Jul 2026, 19:15:30 WIB',
    user: 'Super Admin',
    action: 'PUBLISH_MATCH_RESULT',
    module: 'Match Result',
    details: 'Mempublikasikan hasil pertandingan Bandung Cakra FC (2) vs (1) Bali Dewata FC',
  },
  {
    id: 'log-2',
    timestamp: '13 Jul 2026, 18:45:12 WIB',
    user: 'Match Editor A',
    action: 'UPDATE_LINEUP_DRAFT',
    module: 'Lineup Pertandingan',
    details: 'Mengubah starting XI Jakarta Garuda FC vs Surabaya Samudra FC',
  },
  {
    id: 'log-3',
    timestamp: '13 Jul 2026, 17:30:22 WIB',
    user: 'Rumor Editor X',
    action: 'CREATE_RUMOR',
    module: 'Rumor & Transfer',
    details: 'Membuat draft rumor baru: Jakarta Garuda FC Memantau Penyerang Muda Ardi Pratama',
  }
];
