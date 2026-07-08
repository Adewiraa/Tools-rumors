import { NextResponse } from "next/server";
import { getCountryCodeFromName } from "@/lib/countries";

interface ParsedPlayer {
  id: string;
  name: string;
  shirtNumber: number;
  nationality: string;
  countryCode: string;
  appearances?: number;
  age?: number;
}

const allowedHost = "ileague.id";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get("url");

  if (!sourceUrl) {
    return NextResponse.json(
      { error: "Parameter url wajib diisi." },
      { status: 400 },
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: "URL tidak valid." }, { status: 400 });
  }

  if (
    parsedUrl.hostname !== allowedHost ||
    !parsedUrl.pathname.startsWith("/clubs/single/")
  ) {
    return NextResponse.json(
      { error: "Hanya URL klub resmi ileague.id yang didukung." },
      { status: 400 },
    );
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "User-Agent": "GosballMediaTools/0.1 (+https://gosball.local)",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Gagal mengambil data iLeague (${response.status}).` },
      { status: 502 },
    );
  }

  const html = await response.text();
  const lines = htmlToLines(html);
  const clubSlug = parsedUrl.pathname.split("/").filter(Boolean).at(-1) ?? "";
  const teamName = parseTeamName(lines, clubSlug);
  const coachName = parseCoachName(lines);
  const players = parsePlayers(lines, clubSlug);

  return NextResponse.json({
    sourceUrl: parsedUrl.toString(),
    teamName,
    shortName: createShortName(teamName),
    coachName,
    players,
  });
}

function htmlToLines(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "\n")
      .replace(/<style[\s\S]*?<\/style>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d|span|a|section|article|tr|td)>/gi, "\n")
      .replace(/<[^>]+>/g, "\n"),
  )
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseTeamName(lines: string[], clubSlug: string) {
  const slugName = clubSlug.replace(/_/g, " ");
  const upperSlugName = slugName.toUpperCase();
  const exactLine = lines.find((line) => line.toUpperCase() === upperSlugName);

  return exactLine ?? slugName;
}

function parseCoachName(lines: string[]) {
  const profileCoachIndex = lines.findIndex((line) =>
    /^Pelatih:?$/i.test(line),
  );

  if (profileCoachIndex >= 0 && lines[profileCoachIndex + 1]) {
    return lines[profileCoachIndex + 1];
  }

  const headCoachIndex = lines.findIndex((line) =>
    /^Pelatih Kepala$/i.test(line),
  );

  if (headCoachIndex > 0) {
    return lines[headCoachIndex - 1].replace(/^\d+\s+/, "");
  }

  return "Head Coach";
}

function parsePlayers(lines: string[], clubSlug: string): ParsedPlayer[] {
  const players: ParsedPlayer[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const playerLine = lines[index].match(/^(\d{1,3})\s+(.{2,})$/);
    const countryLine = lines[index + 1]?.match(/^Negara\s+(.+)$/i);

    if (!playerLine || !countryLine) {
      continue;
    }

    const shirtNumber = Number(playerLine[1]);
    const name = playerLine[2].trim();
    const nationality = countryLine[1].trim();
    const playerKey = `${shirtNumber}-${name}`;

    if (seen.has(playerKey)) {
      continue;
    }

    const appearancesLine = lines[index + 2]?.match(/^Penampilan\s+(\d+)/i);
    const ageLine = lines[index + 3]?.match(/^Usia\s+(\d+)/i);

    seen.add(playerKey);
    players.push({
      id: `${clubSlug.toLowerCase()}-${shirtNumber}-${slugify(name)}`,
      name,
      shirtNumber,
      nationality,
      countryCode: getCountryCodeFromName(nationality),
      appearances: appearancesLine ? Number(appearancesLine[1]) : undefined,
      age: ageLine ? Number(ageLine[1]) : undefined,
    });
  }

  return players;
}

function createShortName(teamName: string) {
  const cleaned = teamName.replace(/\b(FC|F\.C\.|UNITED|CLUB)\b/gi, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 6).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 4))
    .join("")
    .slice(0, 8)
    .toUpperCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
