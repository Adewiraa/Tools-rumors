export type ToolMode = "lineup" | "matchResult" | "rumor" | "master";

export type CanvasAspectRatio = "4:5" | "9:16";

export type FormationName =
  | "4-3-3"
  | "4-2-3-1"
  | "4-4-2"
  | "4-1-4-1"
  | "4-3-2-1"
  | "4-3-1-2"
  | "4-5-1"
  | "4-1-2-1-2"
  | "4-2-2-2"
  | "4-4-1-1"
  | "3-5-2"
  | "3-1-4-2"
  | "3-4-3"
  | "3-4-2-1"
  | "3-4-1-2"
  | "5-3-2"
  | "5-2-3"
  | "5-4-1";

export type PlayerPosition =
  | "GK"
  | "DF"
  | "MF"
  | "FW"
  | "Coach"
  | "Unknown";

export type RumorStatus = "Rumor" | "Advanced Talks" | "Here We Go";

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  club?: string;
  nationality?: string;
  countryCode?: string;
  countryFlagUrl?: string;
  flagEmoji?: string;
  isForeign?: boolean;
  shirtNumber?: number;
  photoUrl?: string;
  transfermarktId?: string;
}

export interface FormationCoordinate {
  id: string;
  label: string;
  position: PlayerPosition;
  x: number;
  y: number;
}

export interface FormationTemplate {
  name: FormationName;
  coordinates: FormationCoordinate[];
}

export interface SponsorConfig {
  enabled: boolean;
  brandName: string;
  logoUrl?: string;
}

export interface TeamLineup {
  id: string;
  name: string;
  shortName: string;
  formation: FormationName;
  logoUrl?: string;
  primaryColor: string;
  starters: Player[];
  substitutes: Player[];
  coach: Player;
}

export interface MatchdayLineupData {
  competitionName: string;
  matchLabel: string;
  venue?: string;
  homeTeam: TeamLineup;
  awayTeam: TeamLineup;
  sponsor: SponsorConfig;
}

export interface TransferRumorData {
  player: Player | null;
  percentage: number;
  status: RumorStatus;
  fromClub: string;
  toClub: string;
  sponsor: SponsorConfig;
}

export type MatchResultStatus = "FT" | "AET" | "PEN" | "LIVE";

export type GoalType = "NORMAL" | "P" | "OG" | "FK";

export interface MatchResultTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor: string;
  score: number;
  penaltyScore?: number;
}

export interface GoalScorer {
  id: string;
  team: "home" | "away";
  playerName: string;
  minute: string;
  type: GoalType;
}

export interface MatchResultData {
  competitionName: string;
  matchLabel: string;
  venue?: string;
  status: MatchResultStatus;
  customStatus?: string;
  homeTeam: MatchResultTeam;
  awayTeam: MatchResultTeam;
  scorers: GoalScorer[];
  backgroundImageUrl?: string;
  overlayOpacity: number;
  motm?: string;
  note?: string;
  sponsor: SponsorConfig;
}
