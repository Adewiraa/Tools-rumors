import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

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
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY belum diset. Tambahkan service role key di .env.local untuk fitur Master Data.",
      },
      { status: 500 },
    );
  }

  const payload = (await request.json()) as ClubPayload;
  const name = payload.name?.trim();
  const shortName = payload.shortName?.trim();
  const slug = payload.slug?.trim() ? toSlug(payload.slug) : name ? toSlug(name) : "";

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
        logo_public_url: payload.logoPublicUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select(
      "id,name,short_name,slug,ileague_slug,ileague_url,primary_color,logo_public_url,city",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Gagal menyimpan klub: ${error.message}` },
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
      logoUrl: data.logo_public_url,
      city: data.city,
    },
  });
}
