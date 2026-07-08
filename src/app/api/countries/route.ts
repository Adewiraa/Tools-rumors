import { NextResponse } from "next/server";

interface RestCountriesRecord {
  names?: {
    common?: string;
    official?: string;
  };
  codes?: {
    alpha_2?: string;
    alpha_3?: string;
  };
  flag?: {
    emoji?: string;
    url_svg?: string;
    url_png?: string;
  };
  region?: string;
  subregion?: string;
}

const restCountriesBaseUrl = "https://api.restcountries.com/countries/v5";

export async function GET(request: Request) {
  const token = process.env.RESTCOUNTRIES_API_TOKEN;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "RESTCOUNTRIES_API_TOKEN belum diset di environment." },
      { status: 500 },
    );
  }

  if (!query) {
    return NextResponse.json({ countries: [] });
  }

  const upstreamUrl = new URL(restCountriesBaseUrl);
  upstreamUrl.searchParams.set("q", query);
  upstreamUrl.searchParams.set(
    "response_fields",
    "names,codes,flag,region,subregion",
  );
  upstreamUrl.searchParams.set("limit", "12");

  const response = await fetch(upstreamUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `REST Countries gagal (${response.status}).` },
      { status: 502 },
    );
  }

  const records = (await response.json()) as RestCountriesRecord[];
  const countries = records
    .map((record) => ({
      code: record.codes?.alpha_2?.toUpperCase() ?? "",
      name: record.names?.common ?? record.names?.official ?? "",
      region: record.subregion ?? record.region ?? "Unknown",
      flagSvgUrl: record.flag?.url_svg,
      flagPngUrl: record.flag?.url_png,
    }))
    .filter((country) => country.code && country.name);

  return NextResponse.json({ countries });
}
