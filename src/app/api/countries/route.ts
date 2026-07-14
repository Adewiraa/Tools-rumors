import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`
    );

    if (!response.ok) {
      return NextResponse.json({ data: [] });
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ data: [] });
    }

    // Map to frontend-expected structure: { names: { common, official }, flag: { url_svg, url_png } }
    const mappedData = data.map((item: any) => ({
      names: {
        common: item.name?.common || '',
        official: item.name?.official || ''
      },
      flag: {
        url_svg: item.flags?.svg || '',
        url_png: item.flags?.png || ''
      }
    }));

    return NextResponse.json({ data: mappedData });
  } catch (error: any) {
    console.error('Error fetching country from Rest Countries:', error);
    return NextResponse.json({ data: [], error: error.message });
  }
}
