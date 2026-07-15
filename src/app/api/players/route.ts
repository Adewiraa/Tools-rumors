import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, player, clubSeasonId } = body;

    if (action === 'upsert') {
      // 1. Upsert player profile
      const playerPayload = {
        id: player.id,
        full_name: player.fullName,
        display_name: player.displayName,
        country_code: player.nationality === 'Indonesia' ? 'ID' : player.nationality?.slice(0, 2).toUpperCase() || 'XX',
        country_name: player.nationality,
        country_flag_url: player.flagUrl,
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
