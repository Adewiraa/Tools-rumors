import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
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
      return NextResponse.json({ error: `API responded with status ${response.status}`, details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching country from Rest Countries:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
