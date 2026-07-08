import { NextResponse } from "next/server";
import { indonesianClubs } from "@/lib/indonesian-clubs";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { DatabaseClub } from "@/types/database";

export async function GET() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({
      source: "local",
      clubs: indonesianClubs.map((club) => ({
        id: club.slug,
        name: club.name,
        shortName: club.shortName,
        slug: club.slug,
        ileagueSlug: club.ileagueSlug,
        ileagueUrl: club.ileagueUrl,
        primaryColor: club.primaryColor,
        logoUrl: null,
        city: null,
      })),
    });
  }

  const { data, error } = await supabase
    .from("clubs")
    .select(
      "id,name,short_name,slug,ileague_slug,ileague_url,primary_color,secondary_color,logo_storage_path,logo_public_url,city",
    )
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Gagal memuat master klub." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    source: "supabase",
    clubs: ((data ?? []) as DatabaseClub[]).map((club) => ({
      id: club.id,
      name: club.name,
      shortName: club.short_name,
      slug: club.slug,
      ileagueSlug: club.ileague_slug,
      ileagueUrl: club.ileague_url,
      primaryColor: club.primary_color,
      logoUrl: club.logo_public_url,
      city: club.city,
    })),
  });
}
