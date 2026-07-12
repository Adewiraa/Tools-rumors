import { NextResponse } from "next/server";
import { competitionMasters } from "@/lib/competitions";
import {
  createSupabaseAdminClient,
  getMissingSupabaseAdminEnvVars,
} from "@/lib/supabase-server";

interface ClubPayload {
  name?: string;
  shortName?: string;
  slug?: string;
  city?: string;
  ileagueSlug?: string;
  ileagueUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoPublicUrl?: string;
  logoStoragePath?: string;
  coachName?: string;
  competitionSlugs?: string[];
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  const payload = (await request.json()) as ClubPayload;
  const name = payload.name?.trim();
  const shortName = payload.shortName?.trim();
  const slug = payload.slug?.trim() ? toSlug(payload.slug) : name ? toSlug(name) : "";
  const coachName = payload.coachName?.trim() || null;
  const managedSeasonCodes = competitionMasters.map(
    (competition) => competition.seasonCode,
  );
  const selectedCompetitions = competitionMasters.filter((competition) =>
    (payload.competitionSlugs?.length
      ? payload.competitionSlugs
      : ["super-league"]
    ).includes(competition.slug),
  );

  if (!name || !shortName || !slug) {
    return NextResponse.json(
      { error: "Nama klub, short name, dan slug wajib diisi." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("clubs")
    .upsert(
      {
        name,
        short_name: shortName,
        slug,
        city: payload.city?.trim() || null,
        ileague_slug: payload.ileagueSlug?.trim() || null,
        ileague_url: payload.ileagueUrl?.trim() || null,
        primary_color: payload.primaryColor || "#533AFD",
        secondary_color: payload.secondaryColor || "#E5EDF5",
        logo_storage_path: payload.logoStoragePath?.trim() || null,
        logo_public_url: payload.logoPublicUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select(
      "id,name,short_name,slug,ileague_slug,ileague_url,primary_color,logo_storage_path,logo_public_url,city",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Gagal menyimpan klub: ${error.message}` },
      { status: 500 },
    );
  }

  const { data: seasons, error: seasonError } = await supabase
    .from("seasons")
    .select("id,code")
    .in("code", [
      ...new Set([
        ...managedSeasonCodes,
        ...selectedCompetitions.map((competition) => competition.seasonCode),
      ]),
    ]);
  const selectedSeasonCodes = new Set(
    selectedCompetitions.map((competition) => competition.seasonCode),
  );
  const selectedSeasons =
    seasons?.filter((season) => selectedSeasonCodes.has(season.code)) ?? [];
  const unselectedManagedSeasonIds =
    seasons
      ?.filter((season) => !selectedSeasonCodes.has(season.code))
      .map((season) => season.id) ?? [];

  if (seasonError || selectedSeasons.length === 0) {
    return NextResponse.json(
      {
        error:
          "Klub tersimpan, tapi season kompetisi belum ditemukan. Jalankan seed Supabase terbaru.",
      },
      { status: 500 },
    );
  }

  if (unselectedManagedSeasonIds.length > 0) {
    const { error: cleanupSeasonError } = await supabase
      .from("club_seasons")
      .delete()
      .eq("club_id", data.id)
      .in("season_id", unselectedManagedSeasonIds);

    if (cleanupSeasonError) {
      return NextResponse.json(
        {
          error: `Gagal membersihkan kompetisi klub: ${cleanupSeasonError.message}`,
        },
        { status: 500 },
      );
    }
  }

  const { error: clubSeasonError } = await supabase.from("club_seasons").upsert(
    selectedSeasons.map((season) => ({
      club_id: data.id,
      season_id: season.id,
      head_coach:
        season.code === "BRI_SUPER_LEAGUE_2026-27" ? coachName : null,
    })),
    { onConflict: "club_id,season_id" },
  );

  if (clubSeasonError) {
    return NextResponse.json(
      { error: `Gagal menyimpan kompetisi klub: ${clubSeasonError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    club: {
      id: data.id,
      name: data.name,
      shortName: data.short_name,
      slug: data.slug,
      ileagueSlug: data.ileague_slug,
      ileagueUrl: data.ileague_url,
      primaryColor: data.primary_color,
      logoStoragePath: data.logo_storage_path,
      logoUrl: data.logo_public_url,
      city: data.city,
      coachName,
      competitionSlugs: selectedCompetitions.map(
        (competition) => competition.slug,
      ),
    },
  });
}
