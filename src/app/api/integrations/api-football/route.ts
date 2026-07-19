import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

const resourceEndpointMap: Record<string, string> = {
  status: '/status',
  fixtures: '/fixtures',
  events: '/fixtures/events',
  lineups: '/fixtures/lineups',
  teams: '/teams',
  players: '/players',
  leagues: '/leagues',
};

const allowedParams = new Set([
  'id',
  'fixture',
  'team',
  'player',
  'league',
  'season',
  'date',
  'from',
  'to',
  'live',
  'timezone',
  'country',
  'name',
  'search',
  'type',
  'page',
]);

const readApiKeyFromLocalEnv = () => {
  try {
    let currentDir = process.cwd();
    const envPaths: string[] = [];

    for (let index = 0; index < 6; index += 1) {
      envPaths.push(join(currentDir, '.env.local'));
      const nextDir = dirname(currentDir);
      if (nextDir === currentDir) break;
      currentDir = nextDir;
    }

    const envPath = envPaths.find(path => existsSync(path));
    if (!envPath) return '';

    const envContent = readFileSync(envPath, 'utf8');
    const line = envContent
      .split(/\r?\n/)
      .find(item => item.trim().startsWith('API_FOOTBALL_KEY=') || item.trim().startsWith('APISPORTS_KEY='));

    if (!line) return '';
    const [, ...valueParts] = line.split('=');
    return valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  } catch {
    return '';
  }
};

export async function GET(request: Request) {
  const apiKey = process.env.API_FOOTBALL_KEY || process.env.APISPORTS_KEY || readApiKeyFromLocalEnv();

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'API_FOOTBALL_KEY belum terbaca oleh server. Pastikan .env.local ada lalu restart dev server.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource') || 'status';
  const endpoint = resourceEndpointMap[resource];

  if (!endpoint) {
    return NextResponse.json({ success: false, error: 'Resource API-Football tidak didukung.' }, { status: 400 });
  }

  const upstreamParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'resource' && allowedParams.has(key) && value) {
      upstreamParams.set(key, value);
    }
  });

  const upstreamUrl = `${API_FOOTBALL_BASE_URL}${endpoint}${upstreamParams.size ? `?${upstreamParams.toString()}` : ''}`;

  try {
    const response = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
      cache: 'no-store',
    });
    const text = await response.text();
    const data = text.trim() ? JSON.parse(text) : { response: [], results: 0 };
    const remainingRequests = response.headers.get('x-ratelimit-requests-remaining');
    const requestLimit = response.headers.get('x-ratelimit-requests-limit');

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.message || data?.errors || `API-Football HTTP ${response.status}`,
          meta: { remainingRequests, requestLimit },
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        resource,
        endpoint,
        remainingRequests,
        requestLimit,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghubungi API-Football.' },
      { status: 500 }
    );
  }
}
