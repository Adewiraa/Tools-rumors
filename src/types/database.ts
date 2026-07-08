export interface DatabaseClub {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  ileague_slug: string | null;
  ileague_url: string | null;
  primary_color: string;
  secondary_color: string;
  logo_storage_path: string | null;
  logo_public_url: string | null;
  city: string | null;
}

export interface DatabaseRosterPlayer {
  roster_id: string;
  player_id: string;
  full_name: string;
  display_name: string | null;
  country_code: string;
  country_name: string | null;
  country_flag_url: string | null;
  shirt_number: number | null;
  position: string;
}
