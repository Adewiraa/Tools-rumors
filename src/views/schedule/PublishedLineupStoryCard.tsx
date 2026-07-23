'use client';

import React from 'react';
import { Match, Player, Competition, Club } from '@/lib/mockData';
import {
  areCountriesEquivalent,
  DEFAULT_APP_SETTINGS,
  renderPublishedStoryFlag,
} from '@/logic/utils';
import type { AppSettings } from '@/logic/utils';

interface PublishedLineupStoryCardProps {
  match: Match;
  players: Player[];
  competitions: Competition[];
  clubs?: Club[];
  elementId: string;
  appSettings?: AppSettings;
}

export default function PublishedLineupStoryCard({ match, players, competitions, clubs = [], elementId, appSettings = DEFAULT_APP_SETTINGS }: PublishedLineupStoryCardProps) {
  const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
  const homeSquad = players.filter(p => p.clubId === match.homeClubId);
  const awaySquad = players.filter(p => p.clubId === match.awayClubId);
  const comp = competitions.find(c => c.name === match.competition);
  const homeClub = clubs.find(club => club.id === match.homeClubId);
  const awayClub = clubs.find(club => club.id === match.awayClubId);
  const inferLocalCountryFromSquad = (squad: Player[]) => {
    const counts = new Map<string, number>();
    squad.forEach(player => {
      const nationality = player.nationality?.trim();
      if (!nationality) return;
      counts.set(nationality, (counts.get(nationality) || 0) + 1);
    });

    const [country, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    return count >= Math.max(3, Math.ceil(squad.length * 0.35)) ? country : '';
  };
  const getLocalCountryForSide = (side: 'home' | 'away') => {
    const club = side === 'home' ? homeClub : awayClub;
    const squad = side === 'home' ? homeSquad : awaySquad;
    const clubCountry = club?.country?.trim();
    if (clubCountry && !areCountriesEquivalent(clubCountry, 'Indonesia')) return clubCountry;

    const inferredCountry = inferLocalCountryFromSquad(squad);
    if (inferredCountry && !areCountriesEquivalent(inferredCountry, 'Indonesia')) return inferredCountry;

    return clubCountry || comp?.country || 'Indonesia';
  };
  const isForeignForSide = (player: Player, side: 'home' | 'away') => {
    return !areCountriesEquivalent(player.nationality, getLocalCountryForSide(side));
  };
  const homeStarterIds = match.homeStarters || [];
  const awayStarterIds = match.awayStarters || [];
  const homeSubIds = match.homeSubs || [];
  const awaySubIds = match.awaySubs || [];

  const getSelectedPlayers = (squad: Player[], ids: string[]) => squad
    .filter(player => ids.includes(player.id))
    .sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));

  const getForeignPool = (squad: Player[], starterIds: string[], subIds: string[], side: 'home' | 'away') => squad
    .filter(player => !starterIds.includes(player.id) && !subIds.includes(player.id) && isForeignForSide(player, side));

  const renderPlayerLine = (player: Player, captainId: string | undefined, side: 'home' | 'away', muted = false) => {
    const isForeign = isForeignForSide(player, side);
    const isCaptain = player.id === captainId;
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: muted ? 2 : 3 }}>
        <span style={{ fontSize: muted ? 7 : 8, color: muted ? '#555' : '#c8a84b', fontWeight: 700, minWidth: 22, fontVariantNumeric: 'tabular-nums' }}>
          {player.shirtNumber}
        </span>
        {isForeign ? renderPublishedStoryFlag(player, muted ? 10 : 12, muted ? 7 : 8, muted ? 8 : 9) : null}
        <span style={{ fontSize: muted ? 8 : 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: muted ? (isForeign ? '#6b7280' : '#6b7280') : isCaptain ? '#c8a84b' : isForeign ? '#93c5fd' : '#e2e8f0',
          fontWeight: isCaptain ? 700 : 400 }}>
          {player.displayName}{isCaptain ? ' (C)' : ''}
        </span>
      </div>
    );
  };

  const renderTeamColumn = (side: 'home' | 'away') => {
    const isHome = side === 'home';
    const squad = isHome ? homeSquad : awaySquad;
    const starterIds = isHome ? homeStarterIds : awayStarterIds;
    const subIds = isHome ? homeSubIds : awaySubIds;
    const starters = getSelectedPlayers(squad, starterIds);
    const subs = getSelectedPlayers(squad, subIds);
    const nonDsp = getForeignPool(squad, starterIds, subIds, side);
    const code = isHome ? match.homeClubName.slice(0, 3).toUpperCase() : match.awayClubName.slice(0, 3).toUpperCase();
    const captainId = isHome ? match.homeCaptain : match.awayCaptain;

    return (
      <div style={{ flex: 1, padding: isHome ? '10px 10px 10px 16px' : '10px 16px 10px 10px', borderRight: isHome ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
        <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5,
          textTransform: 'uppercase', marginBottom: 7, paddingBottom: 4,
          borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
          {code} - STARTING
        </div>
        {starters.map(player => renderPlayerLine(player, captainId, side))}

        {subs.length > 0 && (
          <>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase',
              margin: '7px 0 4px', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              CADANGAN
            </div>
            {subs.map(player => renderPlayerLine(player, captainId, side, true))}
          </>
        )}

        {nonDsp.length > 0 && (
          <>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#333', letterSpacing: 1, textTransform: 'uppercase',
              margin: '6px 0 3px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              NON-DSP
            </div>
            {nonDsp.map(player => (
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                <span style={{ fontSize: 7, color: '#333', fontWeight: 600, minWidth: 22 }}>{player.shirtNumber}</span>
                {renderPublishedStoryFlag(player, 10, 7, 8)}
                <span style={{ fontSize: 8, color: '#3f4855', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.displayName}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div id={elementId} style={{
      width: 360, minHeight: 640,
      background: '#0a0a0a',
      color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 30px 60px rgba(0,0,0,0.9)', position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
      <div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {comp?.logoUrl && comp.logoUrl.startsWith('http')
          ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, background: 'white', borderRadius: 4, padding: 2 }} />
          : <div style={{ width: 30, height: 30, background: 'rgba(200,168,75,0.12)', borderRadius: 4, border: '1px solid rgba(200,168,75,0.3)' }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#c8a84b', letterSpacing: 2, textTransform: 'uppercase' }}>{match.competition}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'white', letterSpacing: 0.3, marginTop: 1 }}>SUSUNAN PEMAIN</div>
        </div>
        <img src={appSettings.appLogoSrc} alt={appSettings.appName} style={{ width: 44, height: 32, objectFit: 'contain' }} />
      </div>

      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {match.homeLogo && match.homeLogo.startsWith('http')
            ? <img src={match.homeLogo} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
            : <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{match.homeLogo || 'H'}</div>}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{match.homeClubName}</div>
            <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{match.homeFormation || '4-3-3'}</div>
          </div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: 2, padding: '0 10px' }}>VS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
          {match.awayLogo && match.awayLogo.startsWith('http')
            ? <img src={match.awayLogo} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
            : <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{match.awayLogo || 'A'}</div>}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{match.awayClubName}</div>
            <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{match.awayFormation || '4-2-3-1'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {renderTeamColumn('home')}
        {renderTeamColumn('away')}
      </div>

      <div style={{ padding: '8px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 7, color: '#3a3a3a', marginTop: 1 }}>{match.venue}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#c8a84b', letterSpacing: 1 }}>{appSettings.appName.toUpperCase()}</div>
          <div style={{ fontSize: 7, color: '#444', marginTop: 1 }}>{appSettings.appHandle}</div>
        </div>
      </div>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
    </div>
  );
}
