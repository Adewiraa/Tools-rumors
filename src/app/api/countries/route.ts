import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  try {
    const response = await fetch(
      `https://api.restcountries.com/countries/v5?q=${encodeURIComponent(q)}`,
      {
        headers: {
          'Authorization': 'Bearer rc_live_7ed6c608bb5b43ad864e423952ff6e14'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rest Countries API error:', response.status, errorText);
      return NextResponse.json({ data: [] });
    }

    const rawData = await response.json();

    // Response structure: { data: { objects: [...], meta: {...} } }
    const objects = rawData?.data?.objects;

    if (!Array.isArray(objects)) {
      return NextResponse.json({ data: [] });
    }

    // Map to frontend-expected structure: { names: { common, official }, flag: { url_svg, url_png } }
    const mappedData = objects.map((item: any) => ({
      names: {
        common: item.names?.common || '',
        official: item.names?.official || ''
      },
      flag: {
        url_svg: item.flag?.url_svg || '',
        url_png: item.flag?.url_png || ''
      }
    }));

    return NextResponse.json({ data: mappedData });
  } catch (error: any) {
    console.error('Error fetching country from Rest Countries:', error);
    return NextResponse.json({ data: [], error: error.message });
  }
}
