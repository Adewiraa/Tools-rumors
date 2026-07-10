import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getMissingSupabaseAdminEnvVars,
} from "@/lib/supabase-server";
import type { PlayerPosition } from "@/types/gosball";

interface PlayerPayload {
  clubSlug?: string;
  seasonCode?: string;
  fullName?: string;
  displayName?: string;
  countryCode?: string;
  countryName?: string;
  countryFlagUrl?: string;
  shirtNumber?: number | string;
  position?: PlayerPosition;
  sourceUrl?: string;
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    const missingEnvVars = getMissingSupabaseAdminEnvVars();

    return NextResponse.json(
      {
        error: `Environment Supabase admin belum lengkap: ${missingEnvVars.join(
          ", ",
        )}. Tambahkan variable tersebut di Vercel lalu redeploy.`,
      },
      { status: 500 },
    );
  }

  const payload = (await request.json()) as PlayerPayload;
  const clubSlug = payload.clubSlug?.trim();
  const seasonCode = payload.seasonCode?.trim() || "BRI_SUPER_LEAGUE_2025-26";
  const fullName = payload.fullName?.trim();
  const countryCode = (payload.countryCode?.trim() || "ID").toUpperCase();
  const shirtNumber =
    payload.shirtNumber === "" || payload.shirtNumber == null
      ? null
      : Number(payload.shirtNumber);

  if (!clubSlug || !fullName) {
    return NextResponse.json(
      { error: "Klub dan nama pemain wajib diisi." },
      { status: 400 },
    );
  }

  if (shirtNumber !== null && Number.isNaN(shirtNumber)) {
    return NextResponse.json(
      { error: "Nomor punggung harus berupa angka." },
      { status: 400 },
    );
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id,slug")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) {
    return NextResponse.json(
      { error: "Klub tidak ditemukan di master clubs." },
      { status: 404 },
    );
  }

  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id,code")
    .eq("code", seasonCode)
    .single();

  if (seasonError || !season) {
    return NextResponse.json(
      { error: "Season tidak ditemukan di master seasons." },
      { status: 404 },
    );
  }

  const { data: clubSeason, error: clubSeasonError } = await supabase
    .from("club_seasons")
    .upsert(
      {
        club_id: club.id,
        season_id: season.id,
      },
      { onConflict: "club_id,season_id" },
    )
    .select("id")
    .single();

  if (clubSeasonError || !clubSeason) {
    return NextResponse.json(
      { error: `Gagal menyiapkan club season: ${clubSeasonError?.message}` },
      { status: 500 },
    );
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .upsert(
      {
        full_name: fullName,
        display_name: payload.displayName?.trim() || null,
        country_code: countryCode,
        country_name: payload.countryName?.trim() || null,
        country_flag_url: payload.countryFlagUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "full_name,country_code" },
    )
    .select("id,full_name,display_name,country_code,country_name,country_flag_url")
    .single();

  if (playerError || !player) {
    return NextResponse.json(
      { error: `Gagal menyimpan pemain: ${playerError?.message}` },
      { status: 500 },
    );
  }

  const { data: roster, error: rosterError } = await supabase
    .from("club_rosters")
    .upsert(
      {
        club_season_id: clubSeason.id,
        player_id: player.id,
        shirt_number: shirtNumber,
        position: payload.position || "Unknown",
        source_url: payload.sourceUrl?.trim() || null,
      },
      { onConflict: "club_season_id,player_id" },
    )
    .select("id,shirt_number,position")
    .single();

  if (rosterError || !roster) {
    return NextResponse.json(
      { error: `Gagal menyimpan roster pemain: ${rosterError?.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    player,
    roster,
  });
}
