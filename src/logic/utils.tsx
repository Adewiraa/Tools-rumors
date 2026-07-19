import React from 'react';
import { Club, Player, Match, Competition } from '@/lib/mockData';
import { countriesList } from '@/lib/countriesData';

export const APP_NAME = 'Gosball';
export const APP_LOGO_SRC = '/brand/gosball-alt.png';
export const APP_HANDLE = '@GOSBALL';

export const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const hasSavedLineupSelection = (match: Match) => Boolean(
  match.homeStarters?.length ||
  match.awayStarters?.length ||
  match.homeSubs?.length ||
  match.awaySubs?.length
);

export const hasPublishedLineupSnapshot = (match: Match) => (
  match.publicationStatus === 'Published' &&
  (match.homeStarters?.length || 0) >= 11 &&
  (match.awayStarters?.length || 0) >= 11
);

export const getEffectiveLineupStatus = (match: Match): Match['lineupStatus'] => {
  if (match.publicationStatus === 'Published' || match.lineupStatus === 'Complete') return 'Complete';
  return match.lineupStatus;
};

export const getEffectiveMatchStatus = (match: Match): Match['status'] => {
  if (match.status !== 'Scheduled') return match.status;

  const kickoffDate = new Date(match.kickoff);
  if (Number.isNaN(kickoffDate.getTime())) return match.status;

  const today = new Date();
  const isMatchDay =
    kickoffDate.getFullYear() === today.getFullYear() &&
    kickoffDate.getMonth() === today.getMonth() &&
    kickoffDate.getDate() === today.getDate();

  return isMatchDay ? 'Live' : 'Scheduled';
};

export const getEditableScheduleStatus = (match?: Match): Match['status'] => {
  if (match?.status === 'Finished') return 'Finished';
  if (match?.status === 'Postponed' || match?.status === 'Cancelled') return match.status;
  return 'Scheduled';
};

export type ResultGraphicSettings = {
  backgroundImage?: string | null;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  backgroundZoom?: number;
  backgroundDim?: number;
  halfTimeSaved?: boolean;
};

export const RESULT_GRAPHIC_META_TYPE = '__result_graphic_settings';

const isTimelineMetaType = (item: any, type: string) => (
  item && typeof item === 'object' && item.type === type
);

export const getResultGraphicSettings = (match: Match): ResultGraphicSettings => {
  const timeline = Array.isArray(match.timeline) ? match.timeline : [];
  const meta = timeline.find(item => isTimelineMetaType(item, RESULT_GRAPHIC_META_TYPE));
  const settings = meta && typeof meta.settings === 'object' ? meta.settings : (match as any).resultGraphic;
  return settings && typeof settings === 'object' ? settings : {};
};

export const getMatchTimelineEvents = (timeline?: any[]) => (
  Array.isArray(timeline)
    ? timeline.filter(item => item && typeof item === 'object' && !isTimelineMetaType(item, RESULT_GRAPHIC_META_TYPE))
    : []
);

export const getTimelineWithResultGraphicSettings = (timeline: any[], settings: ResultGraphicSettings) => {
  const preservedTimeline = Array.isArray(timeline)
    ? timeline.filter(item => !isTimelineMetaType(item, RESULT_GRAPHIC_META_TYPE))
    : [];

  return [
    ...preservedTimeline,
    {
      id: RESULT_GRAPHIC_META_TYPE,
      type: RESULT_GRAPHIC_META_TYPE,
      settings,
    },
  ];
};

export const hasHalfTimeScoreValues = (match: Match) => (
  match.halfTimeHomeScore !== undefined && match.halfTimeHomeScore !== null &&
  match.halfTimeAwayScore !== undefined && match.halfTimeAwayScore !== null
);

export const hasSavedHalfTimeResult = (match: Match) => {
  const settings = getResultGraphicSettings(match);
  if (settings.halfTimeSaved === true) return true;
  if (settings.halfTimeSaved === false) return false;
  return match.status !== 'Finished' && hasHalfTimeScoreValues(match);
};

export const hasResultProgress = (match: Match) => (
  hasSavedHalfTimeResult(match) ||
  (match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null)
);

export const storyNormalizeCountryValue = (value?: string) => (value || '').trim().toLowerCase();

export const storyNormalizeCountryCodeCandidate = (value?: string) => {
  const normalizedValue = storyNormalizeCountryValue(value);
  if (/^[a-z]{2}$/.test(normalizedValue)) return normalizedValue;
  if (normalizedValue.startsWith('gb-')) return 'gb';
  return '';
};

export const storyExtractCountryCodeFromFlagUrl = (flagUrl?: string) => {
  const match = (flagUrl || '').match(/\/([a-z]{2})\.(?:svg|png)$/i);
  return match?.[1] || '';
};

export const storyFindCountryForPlayer = (player: Player) => {
  const countryCode = storyNormalizeCountryValue(player.countryCode);
  if (countryCode) {
    const byCode = countriesList.find(country => {
      const code = storyNormalizeCountryValue(country.code);
      return code === countryCode || (countryCode.length === 2 && code.startsWith(countryCode));
    });
    if (byCode) return byCode;
  }

  const nationality = storyNormalizeCountryValue(player.nationality);
  if (!nationality) return undefined;
  return countriesList.find(country => storyNormalizeCountryValue(country.name) === nationality);
};

export const storyGetPlayerCountryCode = (player: Player) => (
  storyNormalizeCountryCodeCandidate(player.countryCode) ||
  storyNormalizeCountryCodeCandidate(player.flagUrl) ||
  storyNormalizeCountryCodeCandidate(storyFindCountryForPlayer(player)?.code) ||
  storyNormalizeCountryCodeCandidate(storyExtractCountryCodeFromFlagUrl(player.flagUrl))
);

export const storyCountryCodeToFlagUrl = (countryCode?: string) => {
  const normalizedCode = storyNormalizeCountryCodeCandidate(countryCode);
  if (!normalizedCode) return '';
  return `https://flagcdn.com/w40/${normalizedCode}.png`;
};

export const storyCountryCodeToInlineFlagSrc = (countryCode?: string) => {
  const code = storyNormalizeCountryCodeCandidate(countryCode);
  const flagSvgByCode: Record<string, string> = {
    ar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#75aadb" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><circle cx="15" cy="10" r="1.5" fill="#f6b40e"/></svg>',
    br: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009b3a" d="M0 0h30v20H0z"/><path fill="#ffdf00" d="M15 2 28 10 15 18 2 10z"/><circle cx="15" cy="10" r="4.2" fill="#002776"/></svg>',
    co: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fcd116" d="M0 0h30v10H0z"/><path fill="#003893" d="M0 10h30v5H0z"/><path fill="#ce1126" d="M0 15h30v5H0z"/></svg>',
    fr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#002395" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ed2939" d="M20 0h10v20H20z"/></svg>',
    iq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ce1126" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#000" d="M0 13.33h30V20H0z"/><path fill="#007a3d" d="M12 8.2h6v3.6h-6z"/></svg>',
    it: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009246" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ce2b37" d="M20 0h10v20H20z"/></svg>',
    nl: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ae1c28" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#21468b" d="M0 13.33h30V20H0z"/></svg>',
    pt: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#006600" d="M0 0h12v20H0z"/><path fill="#ff0000" d="M12 0h18v20H12z"/><circle cx="12" cy="10" r="3" fill="#ffcc00"/></svg>',
    es: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#aa151b" d="M0 0h30v5H0zm0 15h30v5H0z"/><path fill="#f1bf00" d="M0 5h30v10H0z"/></svg>',
    uy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><path fill="#0038a8" d="M0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0z"/><path fill="#fff" d="M0 0h12v10H0z"/><circle cx="6" cy="5" r="2.2" fill="#fcd116"/></svg>',
  };
  const svg = flagSvgByCode[code];
  return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';
};

export const renderPublishedStoryFlag = (player: Player, width: number, height: number, fontSize: number) => {
  const inlineFlagSrc = storyCountryCodeToInlineFlagSrc(storyGetPlayerCountryCode(player));
  if (inlineFlagSrc) return <img src={inlineFlagSrc} alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;

  const flagUrl = player.flagUrl && player.flagUrl.startsWith('http')
    ? player.flagUrl
    : storyCountryCodeToFlagUrl(player.flagUrl || player.countryCode || storyFindCountryForPlayer(player)?.code);
  if (flagUrl) return <img src={flagUrl} crossOrigin="anonymous" alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;

  return <span style={{ fontSize, color: '#93c5fd', fontWeight: 800, flexShrink: 0 }}>*</span>;
};
