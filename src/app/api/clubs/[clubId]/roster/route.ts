import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { DatabaseRosterPlayer } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: Promise<{
    clubId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const supabase = createSupabaseServerClient();
  const { clubId } = await context.params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const seasonCode = searchParams.get("season") ?? "BRI_SUPER_LEAGUE_2026-27";

  if (!supabase) {
    return NextResponse.json({
      source: "local",
      players: [],
      message: "Supabase env belum diset.",
    });
  }

  let rosterQuery = supabase
    .from("club_rosters")
    .select(
      `
      id,
      shirt_number,
      position,
      club_seasons!inner (
        id,
        clubs!inner ( id, slug ),
        seasons!inner ( code )
      ),
      players!inner (
        id,
        full_name,
        display_name,
        country_code,
        country_name,
        country_flag_url
      )
    `,
    )
    .eq("club_seasons.clubs.slug", clubId)
    .eq("club_seasons.seasons.code", seasonCode)
    .order("shirt_number", { ascending: true });

  if (query) {
    rosterQuery = rosterQuery.ilike("players.full_name", `%${query}%`);
  }

  const { data, error } = await rosterQuery;

  if (error) {
    return NextResponse.json(
      { error: "Gagal memuat roster klub." },
      { status: 500 },
    );
  }

  const players = (data ?? []).map((row: any): DatabaseRosterPlayer => {
    const player = Array.isArray(row.players) ? row.players[0] : row.players;

    return {
      roster_id: row.id,
      player_id: player.id,
      full_name: player.full_name,
      display_name: player.display_name,
      country_code: player.country_code,
      country_name: player.country_name,
      country_flag_url: player.country_flag_url,
      shirt_number: row.shirt_number,
      position: row.position,
    };
  });

  return NextResponse.json(
    {
      source: "supabase",
      players,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
