import { NextResponse } from "next/server";
import { competitionMasters } from "@/lib/competitions";
import { indonesianClubs } from "@/lib/indonesian-clubs";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { DatabaseClub } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function GET() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        source: "local",
        clubs: indonesianClubs.map((club) => ({
          id: club.slug,
          name: club.name,
          shortName: club.shortName,
          slug: club.slug,
          ileagueSlug: club.ileagueSlug,
          ileagueUrl: club.ileagueUrl,
          primaryColor: club.primaryColor,
          logoStoragePath: null,
          logoUrl: null,
          city: null,
          coachName: null,
          competitionSlugs: club.competitionSlugs ?? ["super-league"],
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await supabase
    .from("clubs")
    .select(
      `
      id,
      name,
      short_name,
      slug,
      ileague_slug,
      ileague_url,
      primary_color,
      secondary_color,
      logo_storage_path,
      logo_public_url,
      city,
      club_seasons (
        head_coach,
        seasons (
          code,
          competitions ( code )
        )
      )
    `,
    )
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Gagal memuat master klub." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      source: "supabase",
      clubs: ((data ?? []) as DatabaseClub[]).map((club) => {
        const clubSeason =
          club.club_seasons?.find(
            (seasonLink) =>
              firstRelation(seasonLink.seasons)?.code ===
              "BRI_SUPER_LEAGUE_2025-26",
          ) ?? club.club_seasons?.[0];
        const competitionSlugs = Array.from(
          new Set(
            (club.club_seasons ?? [])
              .map((seasonLink) => {
                const season = firstRelation(seasonLink.seasons);
                const linkedCompetition = firstRelation(season?.competitions);

                return competitionMasters.find(
                  (competition) => competition.code === linkedCompetition?.code,
                )?.slug;
              })
              .filter((slug): slug is string => Boolean(slug)),
          ),
        );

        return {
          id: club.id,
          name: club.name,
          shortName: club.short_name,
          slug: club.slug,
          ileagueSlug: club.ileague_slug,
          ileagueUrl: club.ileague_url,
          primaryColor: club.primary_color,
          logoStoragePath: club.logo_storage_path,
          logoUrl: club.logo_public_url,
          city: club.city,
          coachName: clubSeason?.head_coach ?? null,
          competitionSlugs,
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
