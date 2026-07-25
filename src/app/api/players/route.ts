import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findCountry, getCountryFlagUrl } from '@/lib/countriesData';

// Server-side only — uses service_role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

const positionFromRoster = (position?: string) => {
  const positionMap: Record<string, string> = {
    GK: 'Goalkeeper',
    DF: 'Defender',
    MF: 'Midfielder',
    FW: 'Forward',
    Goalkeeper: 'Goalkeeper',
    Defender: 'Defender',
    Midfielder: 'Midfielder',
    Forward: 'Forward'
  };

  return positionMap[position || ''] || 'Defender';
};

const calculatePlayerCompleteness = (player: any) => {
  const fields = [
    { val: player.fullName, weight: 35 },
    { val: player.displayName, weight: 25 },
    { val: player.clubId, weight: 15 },
    { val: player.position, weight: 15 },
    { val: player.shirtNumber, weight: 10 },
  ];

  return fields.reduce((total, field) => {
    return field.val !== undefined && field.val !== null && field.val !== '' ? total + field.weight : total;
  }, 0);
};

const getDeleteId = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get('id');
  if (queryId) return queryId;

  const rawBody = await request.text();
  if (!rawBody.trim()) return '';

  try {
    const body = JSON.parse(rawBody);
    return typeof body.id === 'string' ? body.id : '';
  } catch {
    return '';
  }
};

export async function GET() {
  try {
    const [
      { data: playersData, error: playersError },
      { data: rostersData, error: rostersError },
      { data: clubSeasonsData, error: clubSeasonsError },
      { data: clubsData, error: clubsError },
    ] = await Promise.all([
      supabaseAdmin.from('players').select('*'),
      supabaseAdmin.from('club_rosters').select('*'),
      supabaseAdmin.from('club_seasons').select('*'),
      supabaseAdmin.from('clubs').select('id, name'),
    ]);

    if (playersError) throw playersError;
    if (rostersError) throw rostersError;
    if (clubSeasonsError) throw clubSeasonsError;
    if (clubsError) throw clubsError;

    const clubSeasonById = new Map((clubSeasonsData || []).map((season: any) => [String(season.id), season]));
    const clubNameById = new Map((clubsData || []).map((club: any) => [String(club.id), club.name]));
    const rosterByPlayerId = new Map<string, any>();

    (rostersData || []).forEach((roster: any) => {
      const playerId = String(roster.player_id || '');
      if (playerId && !rosterByPlayerId.has(playerId)) {
        rosterByPlayerId.set(playerId, roster);
      }
    });

    const mappedPlayers = (playersData || []).map((player: any) => {
      const roster = rosterByPlayerId.get(String(player.id));
      const clubSeason = roster?.club_season_id ? clubSeasonById.get(String(roster.club_season_id)) : undefined;
      const clubId = player.club_id || clubSeason?.club_id || '';
      const nationality = player.country_name || player.nationality || 'Indonesia';
      const matchedCountry = findCountry(nationality) || (player.country_code ? findCountry(player.country_code) : undefined);
      const countryCode = matchedCountry?.code?.toUpperCase() || player.country_code || (nationality === 'Indonesia' ? 'ID' : 'XX');
      const flagUrl = matchedCountry ? `https://flagcdn.com/w40/${matchedCountry.code.toLowerCase()}.png` : (player.country_flag_url || player.flag_url || getCountryFlagUrl(nationality));

      const mappedPlayer = {
        id: player.id,
        fullName: player.full_name,
        displayName: player.display_name || player.full_name,
        clubId,
        clubName: player.club_name || (clubId ? clubNameById.get(String(clubId)) : '') || '',
        position: positionFromRoster(roster?.position || player.position),
        shirtNumber: Number(roster?.shirt_number ?? player.shirt_number) || 0,
        nationality,
        countryCode,
        flagUrl,
        age: Number(player.age) || 20,
        status: player.status || (clubId ? 'active' : 'free_agent'),
        availability: player.availability || 'available',
        completeness: 0
      };

      return {
        ...mappedPlayer,
        completeness: calculatePlayerCompleteness(mappedPlayer)
      };
    });

    return NextResponse.json({ success: true, data: mappedPlayers });
  } catch (err: any) {
    console.error('Player GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, player, clubSeasonId } = body;

    if (action === 'upsert') {
      const matched = findCountry(player.nationality) || (player.countryCode ? findCountry(player.countryCode) : undefined);
      const resolvedCode = matched?.code?.toUpperCase() || (player.nationality === 'Indonesia' ? 'ID' : 'XX');
      const resolvedFlagUrl = matched ? `https://flagcdn.com/w40/${matched.code.toLowerCase()}.png` : player.flagUrl;

      // 1. Upsert player profile
      const playerPayload = {
        id: player.id,
        full_name: player.fullName,
        display_name: player.displayName,
        country_code: resolvedCode,
        country_name: player.nationality,
        country_flag_url: resolvedFlagUrl,
      };

      const { error: playerErr } = await supabaseAdmin
        .from('players')
        .upsert(playerPayload, { onConflict: 'id' });

      if (playerErr) {
        return NextResponse.json({ success: false, error: playerErr.message }, { status: 400 });
      }

      // 2. Handle club_season lookup
      let resolvedClubSeasonId = clubSeasonId;

      if (!resolvedClubSeasonId && player.clubId) {
        const { data: seasonData } = await supabaseAdmin
          .from('club_seasons')
          .select('id')
          .eq('club_id', player.clubId)
          .limit(1);

        resolvedClubSeasonId = seasonData?.[0]?.id;

        // If still no season, find any active season and create one
        if (!resolvedClubSeasonId) {
          const { data: seasonsList } = await supabaseAdmin
            .from('seasons')
            .select('id')
            .limit(1);
          const activeSeasonId = seasonsList?.[0]?.id;

          if (activeSeasonId) {
            const { data: newSeason } = await supabaseAdmin
              .from('club_seasons')
              .insert({ club_id: player.clubId, season_id: activeSeasonId })
              .select('id')
              .single();
            resolvedClubSeasonId = newSeason?.id;
          }
        }
      }

      // 3. Save roster (shirt number + position)
      if (resolvedClubSeasonId) {
        const posMap: Record<string, string> = {
          Goalkeeper: 'GK',
          Defender: 'DF',
          Midfielder: 'MF',
          Forward: 'FW'
        };
        const rosterPayload = {
          player_id: player.id,
          club_season_id: resolvedClubSeasonId,
          shirt_number: player.shirtNumber,
          position: posMap[player.position] || 'MF'
        };

        const { data: existingRoster } = await supabaseAdmin
          .from('club_rosters')
          .select('id')
          .eq('player_id', player.id)
          .limit(1);

        if (existingRoster && existingRoster.length > 0) {
          await supabaseAdmin
            .from('club_rosters')
            .update(rosterPayload)
            .eq('id', existingRoster[0].id);
        } else {
          await supabaseAdmin
            .from('club_rosters')
            .insert(rosterPayload);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Player API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = await getDeleteId(request);

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    // Hapus roster dulu (relasi), lalu player
    await supabaseAdmin.from('club_rosters').delete().eq('player_id', id);

    const { error } = await supabaseAdmin
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Player DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
