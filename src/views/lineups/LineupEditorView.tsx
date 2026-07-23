'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Match, Player, Club, Competition } from '@/lib/mockData';
import { countriesList } from '@/lib/countriesData';
import {
  ArrowLeft,
  ChevronRight,
  Upload,
  Search,
  Share2,
  Download,
  Lock,
  X
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import {
  areCountriesEquivalent,
  getEffectiveMatchStatus,
  getEffectiveLineupStatus,
  renderPublishedStoryFlag,
} from '@/logic/utils';
import LoadingButton from '@/views/shared/LoadingButton';

interface AsingEntry { id: string; name: string; no: number; pos: string; }

const DEFAULT_LINEUP_REGULATION = {
  foreignRegulationFree: false,
  maxForeignStarters: 7,
  maxForeignMatchday: 9,
  maxForeignSquad: 11,
  minLocalStarters: 0,
  minLocalMatchday: 0,
};

export default function LineupEditorView({ matchId }: { matchId: string }) {
  const router = useRouter();
  const {
    appSettings,
    clubs,
    players,
    matches,
    setMatches,
    competitions,
    logAction,
    triggerToast
  } = useApp();

  const isNew = matchId === 'new';
  const existingMatch = matches.find(m => m.id === matchId);
  const matchInfoLocked = Boolean(existingMatch);
  const firstComp = competitions.find(c => c.isActive) || competitions[0];

  const [selectedCompetitionName, setSelectedCompetitionName] = useState(existingMatch?.competition || firstComp?.name || '');
  const [selectedHomeClub, setSelectedHomeClub] = useState(existingMatch?.homeClubId || clubs[0]?.id || '');
  const [selectedAwayClub, setSelectedAwayClub] = useState(existingMatch?.awayClubId || clubs[1]?.id || '');
  const [homeFormation, setHomeFormation] = useState(existingMatch?.homeFormation || '4-3-3');
  const [awayFormation, setAwayFormation] = useState(existingMatch?.awayFormation || '4-2-3-1');
  const [kickoffTime, setKickoffTime] = useState(existingMatch?.kickoff || new Date().toISOString());
  const [venueName, setVenueName] = useState(existingMatch?.venue || '');
  const [savingAction, setSavingAction] = useState<'draft' | 'publish' | null>(null);
  const FORMATIONS = ['4-3-3','4-2-3-1','3-5-2','4-4-2','5-3-2','3-4-3','4-1-4-1'];

  // Auto-fill venue dari home club
  useEffect(() => {
    if (!existingMatch?.venue) {
      const hc = clubs.find(c => c.id === selectedHomeClub);
      if (hc?.stadium) setVenueName(hc.stadium);
    }
  }, [selectedHomeClub]);

  const homeSquad = players.filter(p => p.clubId === selectedHomeClub);
  const awaySquad = players.filter(p => p.clubId === selectedAwayClub);
  const homeClub = clubs.find(c => c.id === selectedHomeClub);
  const awayClub = clubs.find(c => c.id === selectedAwayClub);
  const selectedCompetition = competitions.find(c => c.name === (existingMatch?.competition || selectedCompetitionName));
  const lineupRegulation = {
    foreignRegulationFree: selectedCompetition?.foreignRegulationFree ?? DEFAULT_LINEUP_REGULATION.foreignRegulationFree,
    maxForeignStarters: selectedCompetition?.maxForeignStarters ?? DEFAULT_LINEUP_REGULATION.maxForeignStarters,
    maxForeignMatchday: selectedCompetition?.maxForeignMatchday ?? DEFAULT_LINEUP_REGULATION.maxForeignMatchday,
    maxForeignSquad: selectedCompetition?.maxForeignSquad ?? DEFAULT_LINEUP_REGULATION.maxForeignSquad,
    minLocalStarters: selectedCompetition?.minLocalStarters ?? DEFAULT_LINEUP_REGULATION.minLocalStarters,
    minLocalMatchday: selectedCompetition?.minLocalMatchday ?? DEFAULT_LINEUP_REGULATION.minLocalMatchday,
  };

  const [homeStarters, setHomeStarters] = useState<string[]>(existingMatch?.homeStarters || []);
  const [homeSubs, setHomeSubs] = useState<string[]>(existingMatch?.homeSubs || []);
  const [awayStarters, setAwayStarters] = useState<string[]>(existingMatch?.awayStarters || []);
  const [awaySubs, setAwaySubs] = useState<string[]>(existingMatch?.awaySubs || []);
  const [homeCaptain, setHomeCaptain] = useState<string>(existingMatch?.homeCaptain || '');
  const [awayCaptain, setAwayCaptain] = useState<string>(existingMatch?.awayCaptain || '');
  const [homeAsing, setHomeAsing] = useState<AsingEntry[]>(existingMatch?.homeAsing || []);
  const [awayAsing, setAwayAsing] = useState<AsingEntry[]>(existingMatch?.awayAsing || []);
  const [homeAsingInput, setHomeAsingInput] = useState({ name: '', no: '', pos: 'FW' });
  const [awayAsingInput, setAwayAsingInput] = useState({ name: '', no: '', pos: 'FW' });
  const [homePlayerSearch, setHomePlayerSearch] = useState('');
  const [awayPlayerSearch, setAwayPlayerSearch] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExportingStory, setIsExportingStory] = useState(false);
  const isPublishedLineup = existingMatch?.publicationStatus === 'Published';

  const MAX_SUBS          = 15; 

  const inferLocalCountryFromSquad = (squad: Player[]) => {
    const counts = new Map<string, number>();
    squad.forEach(player => {
      const nationality = player.nationality?.trim();
      if (!nationality) return;
      counts.set(nationality, (counts.get(nationality) || 0) + 1);
    });

    const [country, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    const enoughSignal = count >= Math.max(3, Math.ceil(squad.length * 0.35));
    return enoughSignal ? country : '';
  };
  const getLocalCountry = (club?: Club, squad: Player[] = []) => {
    const clubCountry = club?.country?.trim();
    if (clubCountry && !areCountriesEquivalent(clubCountry, 'Indonesia')) return clubCountry;

    const inferredCountry = inferLocalCountryFromSquad(squad);
    if (inferredCountry && !areCountriesEquivalent(inferredCountry, 'Indonesia')) return inferredCountry;

    return clubCountry || selectedCompetition?.country || 'Indonesia';
  };
  const isLocalPlayer = (player: Player, club?: Club, squad: Player[] = []) => (
    areCountriesEquivalent(player.nationality, getLocalCountry(club, squad))
  );
  const isForeignPlayer = (player: Player, club?: Club, squad: Player[] = []) => !isLocalPlayer(player, club, squad);
  const countLocalPlayers = (squad: Player[], ids: string[], club?: Club) => (
    squad.filter(player => ids.includes(player.id) && isLocalPlayer(player, club, squad)).length
  );
  const countForeignPlayers = (squad: Player[], ids: string[], club?: Club) => (
    squad.filter(player => ids.includes(player.id) && isForeignPlayer(player, club, squad)).length
  );
  const getLineupRegulationIssues = (
    label: string,
    club: Club | undefined,
    squad: Player[],
    starters: string[],
    subs: string[]
  ) => {
    const carriedIds = [...starters, ...subs];
    const foreignStarters = countForeignPlayers(squad, starters, club);
    const foreignMatchday = countForeignPlayers(squad, carriedIds, club);
    const localStarters = countLocalPlayers(squad, starters, club);
    const localMatchday = countLocalPlayers(squad, carriedIds, club);
    const issues: string[] = [];

    if (!lineupRegulation.foreignRegulationFree && foreignStarters > lineupRegulation.maxForeignStarters) {
      issues.push(`${label}: asing starting ${foreignStarters}/${lineupRegulation.maxForeignStarters}`);
    }
    if (!lineupRegulation.foreignRegulationFree && foreignMatchday > lineupRegulation.maxForeignMatchday) {
      issues.push(`${label}: asing dibawa ${foreignMatchday}/${lineupRegulation.maxForeignMatchday}`);
    }
    if (lineupRegulation.minLocalStarters > 0 && localStarters < lineupRegulation.minLocalStarters) {
      issues.push(`${label}: lokal starting ${localStarters}/${lineupRegulation.minLocalStarters}`);
    }
    if (lineupRegulation.minLocalMatchday > 0 && localMatchday < lineupRegulation.minLocalMatchday) {
      issues.push(`${label}: lokal dibawa ${localMatchday}/${lineupRegulation.minLocalMatchday}`);
    }

    return issues;
  };

  const homeRegulationIssues = getLineupRegulationIssues('Home', homeClub, homeSquad, homeStarters, homeSubs);
  const awayRegulationIssues = getLineupRegulationIssues('Away', awayClub, awaySquad, awayStarters, awaySubs);
  const homeValid = homeStarters.length === 11 && homeRegulationIssues.length === 0;
  const awayValid = awayStarters.length === 11 && awayRegulationIssues.length === 0;
  const homeHasGK = homeSquad.some(p => homeStarters.includes(p.id) && p.position === 'Goalkeeper');
  const awayHasGK = awaySquad.some(p => awayStarters.includes(p.id) && p.position === 'Goalkeeper');
  const posLabel: Record<string, string> = { Goalkeeper: 'GK', Defender: 'DF', Midfielder: 'MF', Forward: 'FW' };

  const matchesPlayerSearch = (player: Player, query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [
      player.displayName,
      player.fullName,
      String(player.shirtNumber),
      player.position,
      posLabel[player.position],
      player.nationality,
    ].some(value => (value || '').toLowerCase().includes(normalizedQuery));
  };

  const pickPlayer = (
    id: string,
    club: Club | undefined,
    squad: Player[],
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const player = squad.find(p => p.id === id);
    if (!player) return;
    const isForeign = isForeignPlayer(player, club, squad);

    if (isForeign && !lineupRegulation.foreignRegulationFree) {
      const fSt    = countForeignPlayers(squad, starters, club);
      const fSub   = countForeignPlayers(squad, subs, club);
      const fDibawa = fSt + fSub;

      if (fDibawa >= lineupRegulation.maxForeignMatchday) {
        triggerToast(player.displayName + ` tidak bisa dibawa - kuota ${lineupRegulation.maxForeignMatchday} asing per pertandingan sudah penuh.`, 'warning');
        return;
      }

      if (starters.length < 11 && fSt < lineupRegulation.maxForeignStarters) {
        setStarters(p => [...p, id]);
      } else if (starters.length < 11 && fSt >= lineupRegulation.maxForeignStarters) {
        if (subs.length < MAX_SUBS) {
          setSubs(p => [...p, id]);
          triggerToast(player.displayName + ` masuk cadangan - kuota ${lineupRegulation.maxForeignStarters} asing starting sudah penuh`, 'warning');
        } else {
          triggerToast('Cadangan penuh.', 'warning');
        }
      } else if (starters.length >= 11) {
        if (subs.length < MAX_SUBS) {
          setSubs(p => [...p, id]);
        } else {
          triggerToast('Cadangan penuh.', 'warning');
        }
      }
    } else {
      if (starters.length < 11) {
        setStarters(p => [...p, id]);
      } else if (subs.length < MAX_SUBS) {
        setSubs(p => [...p, id]);
      } else {
        triggerToast('Cadangan penuh.', 'warning');
      }
    }
  };

  const returnToPool = (
    id: string,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (starters.includes(id)) setStarters(p => p.filter(x => x !== id));
    else if (subs.includes(id)) setSubs(p => p.filter(x => x !== id));
  };

  const handleSave = async (publish = false) => {
    if (savingAction) return;
    const regulationIssues = [...homeRegulationIssues, ...awayRegulationIssues];
    if (publish && regulationIssues.length > 0) {
      triggerToast(`Regulasi lineup belum terpenuhi: ${regulationIssues.join(', ')}`, 'error');
      return;
    }
    const homeClub = clubs.find(c => c.id === selectedHomeClub);
    const awayClub = clubs.find(c => c.id === selectedAwayClub);
    const competitionName = existingMatch?.competition || selectedCompetitionName;
    const kickoff = existingMatch?.kickoff || kickoffTime;
    const status: Match['lineupStatus'] = homeValid && awayValid && homeHasGK && awayHasGK ? 'Complete' : 'Needs Review';
    const updatedMatch: Match = {
      ...(existingMatch || {}),
      id: existingMatch?.id || 'match-' + Date.now(),
      homeClubId: existingMatch?.homeClubId || selectedHomeClub, homeClubName: existingMatch?.homeClubName || homeClub?.name || '',
      homeLogo: existingMatch?.homeLogo || homeClub?.logoUrl || '',
      awayClubId: existingMatch?.awayClubId || selectedAwayClub, awayClubName: existingMatch?.awayClubName || awayClub?.name || '',
      awayLogo: existingMatch?.awayLogo || awayClub?.logoUrl || '',
      competition: competitionName,
      season: existingMatch?.season || competitions.find(c => c.name === competitionName)?.season || '',
      kickoff, venue: venueName,
      status: existingMatch?.status || 'Scheduled',
      lineupStatus: status,
      publicationStatus: publish ? 'Published' : (existingMatch?.publicationStatus || 'Draft'),
      homeFormation,
      awayFormation,
      homeStarters,
      homeSubs,
      awayStarters,
      awaySubs,
      homeCaptain,
      awayCaptain,
      homeAsing,
      awayAsing,
      editor: 'Admin', lastUpdated: 'Baru saja',
    };

    try {
      setSavingAction(publish ? 'publish' : 'draft');
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', match: updatedMatch })
      });
      const result = await res.json();
      if (!result.success) {
        triggerToast(`Gagal menyimpan lineup: ${result.error}`, 'error');
        return;
      }

      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
      logAction(publish ? 'PUBLISH_LINEUP' : 'SAVE_LINEUP_DRAFT', 'Lineup Pertandingan', `${publish ? 'Menerbitkan' : 'Menyimpan draft'} lineup: ${updatedMatch.homeClubName} vs ${updatedMatch.awayClubName}`);
      triggerToast(publish ? 'Lineup berhasil diterbitkan!' : 'Draft lineup berhasil disimpan!');
      router.push('/lineups');
    } catch (err: any) {
      triggerToast('Terjadi kesalahan saat menyimpan lineup.', 'error');
    } finally {
      setSavingAction(null);
    }
  };

  const storyFileName = 'Lineup_' + (homeClub?.shortName || 'HOME') + '_vs_' + (awayClub?.shortName || 'AWAY') + '.png';

  const createLineupStoryImage = async () => {
    const node = document.getElementById('lineup-story-card');
    if (!node) throw new Error('Preview lineup belum siap.');
    const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob, fileName: storyFileName };
  };

  const downloadLineupStory = async () => {
    if (!isPublishedLineup) {
      triggerToast('Publish lineup dulu untuk membuka download story.', 'warning');
      return;
    }
    try {
      setIsExportingStory(true);
      triggerToast('Membuat gambar...');
      const { dataUrl, fileName } = await createLineupStoryImage();
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Story berhasil diunduh!');
    } catch (err) {
      console.warn('Lineup story download failed:', err);
      triggerToast('Gagal mengunduh story.', 'error');
    } finally {
      setIsExportingStory(false);
    }
  };

  const shareLineupStory = async () => {
    if (!isPublishedLineup) {
      triggerToast('Publish lineup dulu untuk membuka share story.', 'warning');
      return;
    }
    try {
      setIsExportingStory(true);
      triggerToast('Membuat gambar...');
      const { blob, dataUrl, fileName } = await createLineupStoryImage();
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = {
        files: [file],
        title: `${homeClub?.shortName || 'HOME'} vs ${awayClub?.shortName || 'AWAY'}`,
        text: `Lineup ${appSettings.appName}`,
      };

      if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData)) {
        await nav.share(shareData);
        triggerToast('Story siap dibagikan.');
        return;
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.warn('Lineup story share failed:', err);
        triggerToast('Gagal membagikan story.', 'error');
      }
    } finally {
      setIsExportingStory(false);
    }
  };

  const normalizeCountryValue = (value?: string) => (value || '').trim().toLowerCase();

  const findCountryForPlayer = (player: Player) => {
    const countryCode = normalizeCountryValue(player.countryCode);
    if (countryCode) {
      const byCode = countriesList.find(country => {
        const code = normalizeCountryValue(country.code);
        return code === countryCode || (countryCode.length === 2 && code.startsWith(countryCode));
      });
      if (byCode) return byCode;
    }

    const nationality = normalizeCountryValue(player.nationality);
    if (!nationality) return undefined;
    return countriesList.find(country => normalizeCountryValue(country.name) === nationality);
  };

  const extractCountryCodeFromFlagUrl = (flagUrl?: string) => {
    const match = (flagUrl || '').match(/\/([a-z]{2})\.(?:svg|png)$/i);
    return match?.[1] || '';
  };

  const normalizeCountryCodeCandidate = (value?: string) => {
    const normalizedValue = normalizeCountryValue(value);
    if (/^[a-z]{2}$/.test(normalizedValue)) return normalizedValue;
    if (normalizedValue.startsWith('gb-')) return 'gb';
    return '';
  };

  const countryCodeToFlagUrl = (countryCode?: string) => {
    const normalizedCode = normalizeCountryCodeCandidate(countryCode);
    if (!normalizedCode) return '';
    return `https://flagcdn.com/w40/${normalizedCode}.png`;
  };

  const countryCodeToFlagEmoji = (countryCode?: string) => {
    const normalizedCode = normalizeCountryValue(countryCode).slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCode)) return '';
    return String.fromCodePoint(...normalizedCode.split('').map(char => 127397 + char.charCodeAt(0)));
  };

  const resolvePlayerFlagUrl = (player: Player) => {
    if (player.flagUrl && player.flagUrl.startsWith('http')) return player.flagUrl;
    return (
      countryCodeToFlagUrl(player.flagUrl) ||
      countryCodeToFlagUrl(player.countryCode) ||
      countryCodeToFlagUrl(findCountryForPlayer(player)?.code) ||
      findCountryForPlayer(player)?.flagUrl ||
      ''
    );
  };

  const resolvePlayerFlagEmoji = (player: Player) => {
    if (player.flagUrl && !player.flagUrl.startsWith('http') && player.flagUrl.length <= 4 && !normalizeCountryCodeCandidate(player.flagUrl)) return player.flagUrl;
    return countryCodeToFlagEmoji(player.countryCode || findCountryForPlayer(player)?.code || extractCountryCodeFromFlagUrl(player.flagUrl) || normalizeCountryCodeCandidate(player.flagUrl));
  };

  const renderFlag = (player: Player) => {
    const flagUrl = resolvePlayerFlagUrl(player);
    const flagEmoji = resolvePlayerFlagEmoji(player);
    if (flagUrl)
      return <img src={flagUrl} alt="" style={{ width: 14, height: 10, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;
    if (flagEmoji)
      return <span style={{ fontSize: 12, lineHeight: 1, flexShrink: 0 }}>{flagEmoji}</span>;
    return null;
  };

  const renderStoryFlag = (player: Player, width: number, height: number, fontSize: number) => {
    return renderPublishedStoryFlag(player, width, height, fontSize);
  };

  const renderPoolItem = (
    player: Player,
    club: Club | undefined,
    squad: Player[],
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const isForeign = isForeignPlayer(player, club, squad);
    const isUnavail = player.availability !== 'available';
    const bg     = isForeign ? '#fefce8' : 'var(--neutral-50)';
    const border = isForeign ? '1px solid #f59e0b' : '1px solid var(--neutral-200)';
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <button
          onClick={() => pickPlayer(player.id, club, squad, starters, setStarters, subs, setSubs)}
          title={isUnavail ? player.availability : 'Klik untuk tambah ke lineup'}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8, border: border,
            cursor: 'pointer', textAlign: 'left',
            background: bg, color: 'var(--neutral-800)',
            fontSize: 12, fontWeight: isForeign ? 600 : 400,
            opacity: isUnavail ? 0.55 : 1,
            transition: 'background 0.1s, opacity 0.1s',
          }}>
          {renderFlag(player)}
          <span style={{ fontSize: 10, minWidth: 20, color: 'var(--neutral-500)', fontWeight: 700, flexShrink: 0 }}>
            #{player.shirtNumber}
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.displayName}
          </span>
          <span style={{ fontSize: 9, color: 'var(--neutral-400)', flexShrink: 0, letterSpacing: 0.3 }}>
            {posLabel[player.position] || 'MF'}
          </span>
          {isUnavail && (
            <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 800, flexShrink: 0 }}>
              {player.availability === 'injured' ? 'CED' : 'SUS'}
            </span>
          )}
        </button>
      </div>
    );
  };

  const renderSelectedItem = (
    player: Player,
    club: Club | undefined,
    squad: Player[],
    isStarter: boolean,
    captain: string, setCaptain: React.Dispatch<React.SetStateAction<string>>,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    accentColor: string
  ) => {
    const isForeign = isForeignPlayer(player, club, squad);
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <button
          onClick={() => returnToPool(player.id, starters, setStarters, subs, setSubs)}
          title="Klik untuk kembalikan to pool"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
            background: accentColor, color: 'white', fontSize: 12, fontWeight: 600
          }}>
          {renderFlag(player)}
          <span style={{ fontSize: 10, minWidth: 18, opacity: 0.8 }}>#{player.shirtNumber}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.displayName}</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>{posLabel[player.position] || 'MF'}</span>
          {isForeign && <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 800 }}>INT</span>}
        </button>
        {isStarter && (
          <button onClick={() => setCaptain(captain === player.id ? '' : player.id)}
            title="Tandai kapten"
            style={{
              padding: '5px 7px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
              fontSize: 10, fontWeight: 800, flexShrink: 0,
              background: captain === player.id ? '#eab308' : 'transparent',
              color: captain === player.id ? '#000' : 'var(--neutral-400)',
              borderColor: captain === player.id ? '#eab308' : 'var(--neutral-200)'
            }}>C
          </button>
        )}
      </div>
    );
  };

  const renderTeamPanel = (
    side: 'home' | 'away',
    squad: Player[],
    club: Club | undefined,
    formation: string, setFormation: React.Dispatch<React.SetStateAction<string>>,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    captain: string, setCaptain: React.Dispatch<React.SetStateAction<string>>,
    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>,
    asingInput: { name: string; no: string; pos: string },
    setAsingInput: React.Dispatch<React.SetStateAction<{ name: string; no: string; pos: string }>>
  ) => {
    const isHome      = side === 'home';
    const accentColor = isHome ? 'var(--primary-600)' : '#374151';
    const subColor    = isHome ? '#0284c7' : '#6b7280';
    const valid       = starters.length === 11;
    const hasGK       = squad.some(p => starters.includes(p.id) && p.position === 'Goalkeeper');
    const pool = squad.filter(p => !starters.includes(p.id) && !subs.includes(p.id));
    const playerSearch = isHome ? homePlayerSearch : awayPlayerSearch;
    const setPlayerSearch = isHome ? setHomePlayerSearch : setAwayPlayerSearch;
    const filteredPool = pool.filter(player => matchesPlayerSearch(player, playerSearch));
    const starterList = squad.filter(p => starters.includes(p.id))
      .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position)
                   - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position));
    const subList = squad.filter(p => subs.includes(p.id));
    const fSt  = countForeignPlayers(squad, starters, club);
    const fSub = countForeignPlayers(squad, subs, club);
    const fDibawa = fSt + fSub;
    const localStarters = countLocalPlayers(squad, starters, club);
    const localDibawa = countLocalPlayers(squad, [...starters, ...subs], club);

    const foreignPool = filteredPool.filter(p => isForeignPlayer(p, club, squad));
    return (
      <div className="lineup-team-panel">
        <div className="lineup-team-header" style={{ background: accentColor }}>
          {club?.logoUrl && club.logoUrl.startsWith('http')
            ? <img src={club.logoUrl} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
            : <span style={{ fontSize: 18, fontWeight: 700 }}>{isHome ? 'H' : 'A'}</span>}
          <span style={{ fontWeight: 700, fontSize: 13 }}>{isHome ? 'HOME' : 'AWAY'}: {club?.name}</span>
          <select value={formation} onChange={e => setFormation(e.target.value)}
            style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 6px', borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.25)', color: 'white' }}>
            {FORMATIONS.map(fm => <option key={fm} value={fm} style={{ color: 'black', background: 'white' }}>{fm}</option>)}
          </select>
          <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', padding: '2px 8px', borderRadius: 10,
            background: valid && hasGK ? 'rgba(34,197,94,0.35)' : 'rgba(234,179,8,0.35)' }}>
            {starters.length}/11{!hasGK && starters.length > 0 ? ' (GK?)' : ''}
          </span>
        </div>

        <div className="lineup-cols-grid">
          {/* POOL Column */}
          <div className="lineup-col">
            <div className="lineup-col-header">
              Daftar Pemain ({playerSearch.trim() ? `${filteredPool.length}/${pool.length}` : pool.length})
            </div>
            <div className="search-input-wrapper" style={{ maxWidth: '100%', marginBottom: 8 }}>
              <Search size={13} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Cari nama, no, posisi..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                style={{ height: 34, fontSize: 12 }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--neutral-400)', marginBottom: 8, lineHeight: 1.4 }}>
              Klik nama = masuk Starting XI otomatis. Kuning = pemain asing.
            </div>
            {pool.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '16px 0' }}>
                Semua pemain sudah dipilih
              </div>
            )}
            {pool.length > 0 && filteredPool.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '16px 0' }}>
                Pemain tidak ditemukan
              </div>
            )}
            {['Goalkeeper','Defender','Midfielder','Forward'].map(pos => {
              const pp = filteredPool.filter(p => p.position === pos);
              if (!pp.length) return null;
              return (
                <div key={pos} className="pool-pos-group" style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase',
                    marginBottom: 4, paddingBottom: 2, borderBottom: '1px solid var(--neutral-100)' }}>
                    {pos === 'Goalkeeper' ? 'GK' : pos === 'Defender' ? 'DF' : pos === 'Midfielder' ? 'MF' : 'FW'}
                    <span style={{ fontWeight: 400, marginLeft: 4 }}>({pp.length})</span>
                  </div>
                  {pp.map(p => renderPoolItem(p, club, squad, starters, setStarters, subs, setSubs))}
                </div>
              );
            })}
          </div>

          {/* STARTING Column */}
          <div className="lineup-col" style={{ borderLeft: '1px solid var(--neutral-100)' }}>
            <div className="lineup-col-header" style={{ color: accentColor }}>
              Starting XI ({starters.length}/11)
              {fSt > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: '#92400e', marginLeft: 6,
                background: '#fef3c7', padding: '1px 5px', borderRadius: 6 }}>
                {fSt} asing
              </span>}
            </div>
            {starterList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '16px 8px', lineHeight: 1.5 }}>
                Pilih pemain dari daftar kiri.<br />Klik di sini untuk kembalikan ke pool.
              </div>
            ) : (
              starterList.map(p => renderSelectedItem(p, club, squad, true, captain, setCaptain, starters, setStarters, subs, setSubs, accentColor))
            )}
            {asingList.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                borderRadius: 8, background: accentColor, color: 'white', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span style={{ fontSize: 10, opacity: 0.8, minWidth: 20 }}>#{a.no}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{a.pos} INT*</span>
                <button onClick={() => setAsing(p => p.filter(x => x.id !== a.id))}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2, fontWeight: 700 }}>x</button>
              </div>
            ))}
          </div>

          {/* SUBS Column */}
          <div className="lineup-col" style={{ borderLeft: '1px solid var(--neutral-100)' }}>
            <div className="lineup-col-header" style={{ color: subColor }}>
              Cadangan ({subs.length}/{MAX_SUBS})
              {fSub > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: '#92400e', marginLeft: 6,
                background: '#fef3c7', padding: '1px 5px', borderRadius: 6 }}>
                {fSub} asing
              </span>}
            </div>
            {subList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '8px 0' }}>
                Otomatis terisi setelah 11 starter dipilih
              </div>
            ) : (
              subList.map(p => renderSelectedItem(p, club, squad, false, captain, setCaptain, starters, setStarters, subs, setSubs, subColor))
            )}

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--neutral-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                  Tidak Masuk DSP
                </span>
                <span style={{ fontSize: 9, fontWeight: 700,
                  background: !lineupRegulation.foreignRegulationFree && fDibawa >= lineupRegulation.maxForeignMatchday ? '#fee2e2' : '#fef3c7',
                  color: !lineupRegulation.foreignRegulationFree && fDibawa >= lineupRegulation.maxForeignMatchday ? '#991b1b' : '#92400e',
                  padding: '1px 7px', borderRadius: 6 }}>
                  Dibawa: {lineupRegulation.foreignRegulationFree ? `${fDibawa} asing` : `${fDibawa}/${lineupRegulation.maxForeignMatchday}`}
                </span>
              </div>
              {foreignPool.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--neutral-400)', textAlign: 'center', padding: '8px 0' }}>
                  Semua asing masuk DSP pertandingan
                </div>
              ) : (
                foreignPool.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                    borderRadius: 8, background: '#fef3c7', border: '1px solid #f59e0b',
                    fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#78350f' }}>
                    {renderFlag(p)}
                    <span style={{ fontSize: 10, minWidth: 20, opacity: 0.75 }}>#{p.shirtNumber}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>{posLabel[p.position] || 'MF'}</span>
                  </div>
                ))
              )}
              <div style={{ marginTop: 8, fontSize: 9, color: 'var(--neutral-400)', lineHeight: 1.5,
                padding: '5px 7px', background: 'var(--neutral-50)', borderRadius: 6 }}>
                {lineupRegulation.foreignRegulationFree
                  ? 'Asing bebas tanpa batas starting, dibawa, dan DSP'
                  : `Asing maks ${lineupRegulation.maxForeignStarters} starting | ${lineupRegulation.maxForeignMatchday} dibawa | ${lineupRegulation.maxForeignSquad} DSP`}
                {(lineupRegulation.minLocalStarters > 0 || lineupRegulation.minLocalMatchday > 0) && (
                  <><br />Lokal min {lineupRegulation.minLocalStarters} starting | {lineupRegulation.minLocalMatchday} dibawa ({getLocalCountry(club, squad)}: {localStarters}/{localDibawa})</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="lineup-editor-root">
      {/* HEADER */}
      <div className="lineup-editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => router.push('/lineups')} style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
            <span className="hide-mobile"> Kembali</span>
          </button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isNew ? 'Buat Lineup' : `Edit: ${existingMatch?.homeClubName} vs ${existingMatch?.awayClubName}`}
            </h2>
            <div style={{ fontSize: 10, color: 'var(--neutral-500)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              <span style={{ color: homeValid && homeHasGK ? 'var(--success-600)' : 'var(--warning-600)', fontWeight: 600 }}>
                Home {homeStarters.length}/11{homeHasGK ? '' : ' (GK?)'}</span>
              <span style={{ color: awayValid && awayHasGK ? 'var(--success-600)' : 'var(--warning-600)', fontWeight: 600 }}>
                Away {awayStarters.length}/11{awayHasGK ? '' : ' (GK?)'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowPreviewModal(true)}>Preview</button>
          <LoadingButton className="btn btn-sm btn-secondary" onClick={() => handleSave(false)} loading={savingAction === 'draft'} loadingLabel="Menyimpan...">Draft</LoadingButton>
          <LoadingButton className="btn btn-sm btn-primary" onClick={() => handleSave(true)} loading={savingAction === 'publish'} loadingLabel="Menerbitkan...">
            <Upload size={13} /><span className="hide-mobile"> Terbitkan</span>
          </LoadingButton>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="card lineup-info-bar">
        <div className="lineup-info-grid">
          <div>
            <label className="lineup-field-label">Kompetisi</label>
            <select className="form-select" style={{ fontSize: 12 }} value={selectedCompetitionName} disabled={matchInfoLocked} onChange={e => setSelectedCompetitionName(e.target.value)}>
              {competitions.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              {competitions.filter(c => !c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} (nonaktif)</option>)}
            </select>
          </div>
          <div>
            <label className="lineup-field-label">Tim Home</label>
            <select className="form-select" style={{ fontSize: 12 }} value={selectedHomeClub}
              disabled={matchInfoLocked}
              onChange={e => { setSelectedHomeClub(e.target.value); setHomeStarters([]); setHomeSubs([]); setHomeCaptain(''); }}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="lineup-field-label">Tim Away</label>
            <select className="form-select" style={{ fontSize: 12 }} value={selectedAwayClub}
              disabled={matchInfoLocked}
              onChange={e => { setSelectedAwayClub(e.target.value); setAwayStarters([]); setAwaySubs([]); setAwayCaptain(''); }}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="lineup-field-label">Kickoff</label>
            <input type="datetime-local" className="form-input" style={{ fontSize: 11 }}
              value={kickoffTime.slice(0, 16)} disabled={matchInfoLocked} onChange={e => setKickoffTime(new Date(e.target.value).toISOString())} />
          </div>
          <div className="lineup-venue-field">
            <label className="lineup-field-label">Venue <span style={{ fontWeight: 400, fontSize: 9 }}>(auto, editable)</span></label>
            <input type="text" className="form-input" style={{ fontSize: 12 }} placeholder="Nama stadion..." value={venueName} onChange={e => setVenueName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TEAM PANELS */}
      <div className="lineup-teams-grid">
        {renderTeamPanel('home', homeSquad, homeClub, homeFormation, setHomeFormation,
          homeStarters, setHomeStarters, homeSubs, setHomeSubs,
          homeCaptain, setHomeCaptain, homeAsing, setHomeAsing, homeAsingInput, setHomeAsingInput)}
        {renderTeamPanel('away', awaySquad, awayClub, awayFormation, setAwayFormation,
          awayStarters, setAwayStarters, awaySubs, setAwaySubs,
          awayCaptain, setAwayCaptain, awayAsing, setAwayAsing, awayAsingInput, setAwayAsingInput)}
      </div>

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
          onClick={() => setShowPreviewModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxHeight: '95vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {isPublishedLineup ? (
                <>
                  <button className="btn btn-md btn-primary" onClick={shareLineupStory} disabled={isExportingStory}>
                    <Share2 size={14} /> Bagikan Story
                  </button>
                  <button className="btn btn-md btn-secondary" onClick={downloadLineupStory} disabled={isExportingStory}>
                    <Download size={14} /> Unduh PNG
                  </button>
                </>
              ) : (
                <button className="btn btn-md btn-secondary" disabled title="Publish lineup dulu untuk membuka share dan download story.">
                  <Lock size={14} /> Publish Dulu
                </button>
              )}
              <button className="btn btn-md btn-secondary" onClick={() => setShowPreviewModal(false)}>
                <X size={14} /> Tutup
              </button>
            </div>

            <div id="lineup-story-card" style={{
              width: 360, minHeight: 640,
              background: '#0a0a0a',
              color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 30px 60px rgba(0,0,0,0.9)', position: 'relative',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />

              <div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {(() => {
                  const comp = competitions.find(c => c.name === selectedCompetitionName);
                  return comp?.logoUrl && comp.logoUrl.startsWith('http')
                    ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, background: 'white', borderRadius: 4, padding: 2 }} />
                    : <div style={{ width: 30, height: 30, background: 'rgba(200,168,75,0.12)', borderRadius: 4,
                        border: '1px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 6, height: 6, background: '#c8a84b', borderRadius: 1 }} />
                      </div>;
                })()}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: '#c8a84b', letterSpacing: 2, textTransform: 'uppercase' }}>
                    {selectedCompetitionName}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'white', letterSpacing: 0.3, marginTop: 1 }}>SUSUNAN PEMAIN</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 48 }}>
                  <img src={appSettings.appLogoSrc} alt={appSettings.appName} style={{ width: 44, height: 32, objectFit: 'contain' }} />
                </div>
              </div>

              <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  {homeClub?.logoUrl && homeClub.logoUrl.startsWith('http')
                    ? <img src={homeClub.logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
                    : <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{homeClub?.shortName}</div>
                    <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{homeFormation}</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: 2, padding: '0 10px' }}>VS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
                  {awayClub?.logoUrl && awayClub.logoUrl.startsWith('http')
                    ? <img src={awayClub.logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
                    : <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{awayClub?.shortName}</div>
                    <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{awayFormation}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flex: 1 }}>
                <div style={{ flex: 1, padding: '10px 10px 10px 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5,
                    textTransform: 'uppercase', marginBottom: 7, paddingBottom: 4,
                    borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
                    {homeClub?.code || 'HOME'} - STARTING
                  </div>
                  {homeSquad.filter(p => homeStarters.includes(p.id))
                    .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position)
                                 - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position))
                    .map(p => {
                      const isForeign = isForeignPlayer(p, homeClub, homeSquad);
                      const isCaptain = p.id === homeCaptain;
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                          <span style={{ fontSize: 8, color: '#c8a84b', fontWeight: 700, minWidth: 22, fontVariantNumeric: 'tabular-nums' }}>
                            {p.shirtNumber}
                          </span>
                          {isForeign ? renderStoryFlag(p, 12, 8, 9) : null}
                          <span style={{ fontSize: 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: isCaptain ? '#c8a84b' : isForeign ? '#93c5fd' : '#e2e8f0',
                            fontWeight: isCaptain ? 700 : 400 }}>
                            {p.displayName}{isCaptain ? ' (C)' : ''}
                          </span>
                        </div>
                      );
                    })}

                  {homeSubs.length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '7px 0 4px', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        CADANGAN
                      </div>
                      {homeSquad.filter(p => homeSubs.includes(p.id)).map(p => {
                        const isForeign = isForeignPlayer(p, homeClub, homeSquad);
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                            <span style={{ fontSize: 7, color: '#555', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                            {isForeign ? renderStoryFlag(p, 10, 7, 8) : null}
                            <span style={{ fontSize: 8, color: isForeign ? '#6b7280' : '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.displayName}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {homeSquad.filter(p => !homeStarters.includes(p.id) && !homeSubs.includes(p.id) && isForeignPlayer(p, homeClub, homeSquad)).length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#333', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '6px 0 3px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        NON-DSP
                      </div>
                      {homeSquad.filter(p => !homeStarters.includes(p.id) && !homeSubs.includes(p.id) && isForeignPlayer(p, homeClub, homeSquad)).map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#333', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                          {renderStoryFlag(p, 10, 7, 8)}
                          <span style={{ fontSize: 8, color: '#3f4855', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.displayName}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div style={{ flex: 1, padding: '10px 16px 10px 10px' }}>
                  <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5,
                    textTransform: 'uppercase', marginBottom: 7, paddingBottom: 4,
                    borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
                    {awayClub?.code || 'AWAY'} - STARTING
                  </div>
                  {awaySquad.filter(p => awayStarters.includes(p.id))
                    .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position)
                                 - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position))
                    .map(p => {
                      const isForeign = isForeignPlayer(p, awayClub, awaySquad);
                      const isCaptain = p.id === awayCaptain;
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                          <span style={{ fontSize: 8, color: '#c8a84b', fontWeight: 700, minWidth: 22, fontVariantNumeric: 'tabular-nums' }}>
                            {p.shirtNumber}
                          </span>
                          {isForeign ? renderStoryFlag(p, 12, 8, 9) : null}
                          <span style={{ fontSize: 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: isCaptain ? '#c8a84b' : isForeign ? '#93c5fd' : '#e2e8f0',
                            fontWeight: isCaptain ? 700 : 400 }}>
                            {p.displayName}{isCaptain ? ' (C)' : ''}
                          </span>
                        </div>
                      );
                    })}

                  {awaySubs.length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '7px 0 4px', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        CADANGAN
                      </div>
                      {awaySquad.filter(p => awaySubs.includes(p.id)).map(p => {
                        const isForeign = isForeignPlayer(p, awayClub, awaySquad);
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                            <span style={{ fontSize: 7, color: '#555', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                            {isForeign ? renderStoryFlag(p, 10, 7, 8) : null}
                            <span style={{ fontSize: 8, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.displayName}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {awaySquad.filter(p => !awayStarters.includes(p.id) && !awaySubs.includes(p.id) && isForeignPlayer(p, awayClub, awaySquad)).length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#333', letterSpacing: 1, textTransform: 'uppercase',
                        margin: '6px 0 3px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        NON-DSP
                      </div>
                      {awaySquad.filter(p => !awayStarters.includes(p.id) && !awaySubs.includes(p.id) && isForeignPlayer(p, awayClub, awaySquad)).map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#333', fontWeight: 600, minWidth: 22 }}>{p.shirtNumber}</span>
                          {renderStoryFlag(p, 10, 7, 8)}
                          <span style={{ fontSize: 8, color: '#3f4855', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.displayName}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div style={{ padding: '8px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 7, color: '#3a3a3a', marginTop: 1 }}>{venueName}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#c8a84b', letterSpacing: 1 }}>{appSettings.appName.toUpperCase()}</div>
                  <div style={{ fontSize: 7, color: '#444', marginTop: 1 }}>{appSettings.appHandle}</div>
                </div>
              </div>

              <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
