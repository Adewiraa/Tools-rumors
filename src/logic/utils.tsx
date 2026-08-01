import React from 'react';
import { Club, Player, Match, Competition } from '@/lib/mockData';
import { countriesList, findCountry } from '@/lib/countriesData';

export type AppSettings = {
  tenantId?: string;
  appName: string;
  appHandle: string;
  appLogoSrc: string;
  appSubtitle: string;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  tenantId: 'gosball',
  appName: 'Gosball',
  appHandle: '@GOSBALL',
  appLogoSrc: '/brand/gosball-alt.png',
  appSubtitle: 'MEDIA APP',
};

export const DEFAULT_MEDIA_TENANTS = [
  {
    id: 'gosball',
    name: 'Gosball',
    logoSrc: '/brand/gosball-alt.png',
    subtitle: 'Media Sepak Bola',
    handle: '@gosball',
  },
];

export const normalizeAppSettings = (value?: Partial<AppSettings> | null): AppSettings => ({
  tenantId: value?.tenantId || DEFAULT_APP_SETTINGS.tenantId,
  appName: value?.appName !== undefined && value?.appName !== null ? value.appName : DEFAULT_APP_SETTINGS.appName,
  appHandle: value?.appHandle !== undefined && value?.appHandle !== null ? value.appHandle : DEFAULT_APP_SETTINGS.appHandle,
  appLogoSrc: value?.appLogoSrc !== undefined && value?.appLogoSrc !== null ? value.appLogoSrc : DEFAULT_APP_SETTINGS.appLogoSrc,
  appSubtitle: value?.appSubtitle !== undefined && value?.appSubtitle !== null ? value.appSubtitle : DEFAULT_APP_SETTINGS.appSubtitle,
});

export const APP_NAME = DEFAULT_APP_SETTINGS.appName;
export const APP_LOGO_SRC = DEFAULT_APP_SETTINGS.appLogoSrc;
export const APP_HANDLE = DEFAULT_APP_SETTINGS.appHandle;

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
  htBackgroundImage?: string | null;
  htBackgroundPositionX?: number;
  htBackgroundPositionY?: number;
  htBackgroundZoom?: number;
  htBackgroundDim?: number;
  ftBackgroundImage?: string | null;
  ftBackgroundPositionX?: number;
  ftBackgroundPositionY?: number;
  ftBackgroundZoom?: number;
  ftBackgroundDim?: number;
  halfTimeSaved?: boolean;
};

export const getGraphicBackgroundForType = (
  settings: ResultGraphicSettings,
  type: 'HT' | 'FT'
) => {
  if (type === 'HT') {
    return {
      image: settings.htBackgroundImage !== undefined ? settings.htBackgroundImage : (settings.backgroundImage || null),
      positionX: settings.htBackgroundPositionX ?? settings.backgroundPositionX ?? 50,
      positionY: settings.htBackgroundPositionY ?? settings.backgroundPositionY ?? 50,
      zoom: settings.htBackgroundZoom ?? settings.backgroundZoom ?? 100,
      dim: settings.htBackgroundDim ?? settings.backgroundDim ?? 20,
    };
  }
  return {
    image: settings.ftBackgroundImage !== undefined ? settings.ftBackgroundImage : (settings.backgroundImage || null),
    positionX: settings.ftBackgroundPositionX ?? settings.backgroundPositionX ?? 50,
    positionY: settings.ftBackgroundPositionY ?? settings.backgroundPositionY ?? 50,
    zoom: settings.ftBackgroundZoom ?? settings.backgroundZoom ?? 100,
    dim: settings.ftBackgroundDim ?? settings.backgroundDim ?? 20,
  };
};

export type MatchMediaSettings = {
  enabled?: boolean;
  ads?: MatchMediaAdItem[];
  image?: string | null;
  video?: string | null;
  label?: string;
  placement?: 'footer' | 'header-right';
  fit?: 'contain' | 'cover';
};

export type MatchMediaAdItem = {
  id?: string;
  mediaType?: 'image' | 'video';
  source?: string | null;
  image?: string | null;
  video?: string | null;
  poster?: string | null;
  label?: string;
  fit?: 'contain' | 'cover';
  fileName?: string;
  mimeType?: string;
  masterAdId?: string;
};

export const RESULT_GRAPHIC_META_TYPE = '__result_graphic_settings';
export const MATCH_MEDIA_META_TYPE = '__match_media_settings';

export const DEFAULT_MATCH_MEDIA_SETTINGS: MatchMediaSettings = {
  enabled: false,
  ads: [],
  image: null,
  video: null,
  label: '',
  placement: 'footer',
  fit: 'contain',
};

const isTimelineMetaType = (item: any, type: string) => (
  item && typeof item === 'object' && item.type === type
);

const isTimelineMetaItem = (item: any) => (
  isTimelineMetaType(item, RESULT_GRAPHIC_META_TYPE) ||
  isTimelineMetaType(item, MATCH_MEDIA_META_TYPE)
);

export const getResultGraphicSettings = (match: Match): ResultGraphicSettings => {
  const timeline = Array.isArray(match.timeline) ? match.timeline : [];
  const meta = timeline.find(item => isTimelineMetaType(item, RESULT_GRAPHIC_META_TYPE));
  const settings = meta && typeof meta.settings === 'object' ? meta.settings : (match as any).resultGraphic;
  return settings && typeof settings === 'object' ? settings : {};
};

export const getMatchMediaSettings = (match: Match): MatchMediaSettings => {
  const timeline = Array.isArray(match.timeline) ? match.timeline : [];
  const meta = timeline.find(item => isTimelineMetaType(item, MATCH_MEDIA_META_TYPE));
  const settings = meta && typeof meta.settings === 'object' ? meta.settings : (match as any).matchMedia;

  return settings && typeof settings === 'object'
    ? { ...DEFAULT_MATCH_MEDIA_SETTINGS, ...settings }
    : DEFAULT_MATCH_MEDIA_SETTINGS;
};

export const getMatchMediaAds = (settings?: MatchMediaSettings): MatchMediaAdItem[] => {
  const ads = Array.isArray(settings?.ads) ? settings.ads : [];
  const normalizedAds = ads
    .filter(ad => ad && typeof ad === 'object')
    .map((ad, index) => {
      const source = ad.source || ad.video || ad.image || null;
      const mediaType: 'image' | 'video' =
        ad.mediaType === 'video' ||
        ad.mimeType?.startsWith('video/') ||
        source?.startsWith('data:video') ||
        /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(source || '')
          ? 'video'
          : 'image';

      return {
        id: ad.id || `ad-${index + 1}`,
        mediaType,
        source,
        image: mediaType === 'image' ? source : (ad.image || ad.poster || null),
        video: mediaType === 'video' ? source : null,
        poster: ad.poster || null,
        label: ad.label || '',
        fit: ad.fit || settings?.fit || 'contain',
        fileName: ad.fileName || '',
        mimeType: ad.mimeType || (mediaType === 'video' ? 'video/mp4' : ''),
        masterAdId: ad.masterAdId || '',
      };
    })
    .filter(ad => ad.source || ad.image || ad.video || ad.label.trim());

  if (normalizedAds.length > 0) return normalizedAds;

  if (settings?.image || settings?.video || settings?.label?.trim()) {
    const source = settings.video || settings.image || null;
    const mediaType: 'image' | 'video' = settings.video ? 'video' : 'image';
    return [{
      id: 'ad-1',
      mediaType,
      source,
      image: mediaType === 'image' ? source : null,
      video: mediaType === 'video' ? source : null,
      label: settings.label || '',
      fit: settings.fit || 'contain',
    }];
  }

  return [];
};

export const hasMatchMediaAds = (settings?: MatchMediaSettings) => (
  Boolean(settings?.enabled && getMatchMediaAds(settings).length > 0)
);

export const getMatchTimelineEvents = (timeline?: any[]) => (
  Array.isArray(timeline)
    ? timeline.filter(item => item && typeof item === 'object' && !isTimelineMetaItem(item))
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

export const getTimelineWithMatchMediaSettings = (timeline: any[], settings: MatchMediaSettings) => {
  const normalizedSettings = { ...DEFAULT_MATCH_MEDIA_SETTINGS, ...settings };
  const normalizedAds = getMatchMediaAds(normalizedSettings);
  const preservedTimeline = Array.isArray(timeline)
    ? timeline.filter(item => !isTimelineMetaType(item, MATCH_MEDIA_META_TYPE))
    : [];

  if (!normalizedSettings.enabled && normalizedAds.length === 0) {
    return preservedTimeline;
  }

  return [
    ...preservedTimeline,
    {
      id: MATCH_MEDIA_META_TYPE,
      type: MATCH_MEDIA_META_TYPE,
      settings: {
        ...normalizedSettings,
        ads: normalizedAds,
        image: normalizedAds[0]?.image || null,
        video: normalizedAds[0]?.video || null,
        label: normalizedAds[0]?.label || '',
        fit: normalizedAds[0]?.fit || normalizedSettings.fit,
      },
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

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  singapura: 'singapore',
  singapore: 'singapore',
  indonesia: 'indonesia',
  malaysia: 'malaysia',
  jepang: 'japan',
  belanda: 'netherlands',
  korea: 'south korea',
};

export const normalizeComparableCountryName = (value?: string) => {
  const normalized = (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  return COUNTRY_NAME_ALIASES[normalized] || normalized;
};

export const getComparableCountryKey = (value?: string) => {
  const normalized = normalizeComparableCountryName(value);
  if (!normalized) return '';
  if (/^[a-z]{2}$/.test(normalized)) return normalized;

  const byName = countriesList.find(country => normalizeComparableCountryName(country.name) === normalized);
  if (byName) return byName.code.toLowerCase().slice(0, 2);

  return normalized;
};

export const areCountriesEquivalent = (first?: string, second?: string) => {
  const firstKey = getComparableCountryKey(first);
  const secondKey = getComparableCountryKey(second);
  return Boolean(firstKey && secondKey && firstKey === secondKey);
};

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
  if (player.nationality) {
    const matched = findCountry(player.nationality);
    if (matched) return matched;
  }
  if (player.countryCode) {
    const matched = findCountry(player.countryCode);
    if (matched) return matched;
  }
  if (player.flagUrl) {
    const extracted = storyExtractCountryCodeFromFlagUrl(player.flagUrl);
    if (extracted) return findCountry(extracted);
  }
  return undefined;
};

export const storyGetPlayerCountryCode = (player: Player) => {
  const found = storyFindCountryForPlayer(player);
  if (found) return storyNormalizeCountryCodeCandidate(found.code);
  return (
    storyNormalizeCountryCodeCandidate(player.countryCode) ||
    storyNormalizeCountryCodeCandidate(storyExtractCountryCodeFromFlagUrl(player.flagUrl)) ||
    storyNormalizeCountryCodeCandidate(player.flagUrl)
  );
};

export const storyCountryCodeToFlagUrl = (countryCode?: string) => {
  const normalizedCode = storyNormalizeCountryCodeCandidate(countryCode);
  if (!normalizedCode) return '';
  return `https://flagcdn.com/w40/${normalizedCode}.png`;
};

export const storyCountryCodeToFlagEmoji = (countryCode?: string) => {
  const normalizedCode = storyNormalizeCountryCodeCandidate(countryCode).toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCode)) return '';
  return String.fromCodePoint(...normalizedCode.split('').map(char => 127397 + char.charCodeAt(0)));
};

export const storyCountryCodeToInlineFlagSrc = (countryCode?: string) => {
  const code = storyNormalizeCountryCodeCandidate(countryCode);
  const flagSvgByCode: Record<string, string> = {
    ar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#75aadb" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><circle cx="15" cy="10" r="1.5" fill="#f6b40e"/></svg>',
    br: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009b3a" d="M0 0h30v20H0z"/><path fill="#ffdf00" d="M15 2 28 10 15 18 2 10z"/><circle cx="15" cy="10" r="4.2" fill="#002776"/></svg>',
    co: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fcd116" d="M0 0h30v10H0z"/><path fill="#003893" d="M0 10h30v5H0z"/><path fill="#ce1126" d="M0 15h30v5H0z"/></svg>',
    fr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#002395" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ed2939" d="M20 0h10v20H20z"/></svg>',
    gb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#012169" d="M0 0h30v20H0z"/><path stroke="#fff" stroke-width="4" d="m0 0 30 20M30 0 0 20"/><path stroke="#c8102e" stroke-width="2.4" d="m0 0 30 20M30 0 0 20"/><path fill="#fff" d="M12 0h6v20h-6zM0 7h30v6H0z"/><path fill="#c8102e" d="M13.2 0h3.6v20h-3.6zM0 8.2h30v3.6H0z"/></svg>',
    id: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ce1126" d="M0 0h30v10H0z"/><path fill="#fff" d="M0 10h30v10H0z"/></svg>',
    iq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ce1126" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#000" d="M0 13.33h30V20H0z"/><path fill="#007a3d" d="M12 8.2h6v3.6h-6z"/></svg>',
    it: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#009246" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ce2b37" d="M20 0h10v20H20z"/></svg>',
    jp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><circle cx="15" cy="10" r="5" fill="#bc002d"/></svg>',
    kr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><circle cx="15" cy="10" r="4.2" fill="#c60c30"/><path fill="#003478" d="M15 10a4.2 4.2 0 0 1 0 8.4 4.2 4.2 0 0 1 0-8.4z" transform="translate(0 -4.2)"/><path stroke="#000" stroke-width="1.1" d="m6.5 4 4 2.5m-4 9.5 4-2.5m13-9.5-4 2.5m4 9.5-4-2.5"/></svg>',
    my: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><path stroke="#cc0001" stroke-width="2" d="M0 1h30M0 5h30M0 9h30M0 13h30M0 17h30"/><path fill="#010066" d="M0 0h15v10H0z"/><circle cx="7" cy="5" r="3.3" fill="#ffcc00"/><circle cx="8.1" cy="5" r="2.8" fill="#010066"/><path fill="#ffcc00" d="m11.2 2.2.5 1.5h1.6l-1.3.9.5 1.5-1.3-.9-1.3.9.5-1.5-1.3-.9h1.6z"/></svg>',
    nl: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ae1c28" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#21468b" d="M0 13.33h30V20H0z"/></svg>',
    pt: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#006600" d="M0 0h12v20H0z"/><path fill="#ff0000" d="M12 0h18v20H12z"/><circle cx="12" cy="10" r="3" fill="#ffcc00"/></svg>',
    sg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#ef3340" d="M0 0h30v10H0z"/><path fill="#fff" d="M0 10h30v10H0z"/><circle cx="7" cy="5" r="3.2" fill="#fff"/><circle cx="8.1" cy="5" r="2.7" fill="#ef3340"/><path fill="#fff" d="m11.1 2.3.36 1.1h1.16l-.94.68.36 1.1-.94-.68-.94.68.36-1.1-.94-.68h1.16zm-1.6 4.9.36 1.1h1.16l-.94.68.36 1.1-.94-.68-.94.68.36-1.1-.94-.68h1.16zm3.2 0 .36 1.1h1.16l-.94.68.36 1.1-.94-.68-.94.68.36-1.1-.94-.68h1.16zm1.6-2.45.36 1.1h1.16l-.94.68.36 1.1-.94-.68-.94.68.36-1.1-.94-.68h1.16zm-3.2 0 .36 1.1h1.16l-.94.68.36 1.1-.94-.68-.94.68.36-1.1-.94-.68h1.16z"/></svg>',
    es: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#aa151b" d="M0 0h30v5H0zm0 15h30v5H0z"/><path fill="#f1bf00" d="M0 5h30v10H0z"/></svg>',
    th: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#a51931" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 3h30v14H0z"/><path fill="#2d2a4a" d="M0 6h30v8H0z"/></svg>',
    uy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><path fill="#0038a8" d="M0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0zm0 4h30v2H0z"/><path fill="#fff" d="M0 0h12v10H0z"/><circle cx="6" cy="5" r="2.2" fill="#fcd116"/></svg>',
  };
  const svg = flagSvgByCode[code];
  if (svg) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return '';
};

export const renderPublishedStoryFlag = (player: Player, width: number, height: number, fontSize: number) => {
  const countryCode = storyGetPlayerCountryCode(player);
  const inlineFlagSrc = storyCountryCodeToInlineFlagSrc(countryCode);
  if (inlineFlagSrc) return <img src={inlineFlagSrc} alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;

  const resolvedFlagUrl = storyCountryCodeToFlagUrl(countryCode);
  const flagUrl = resolvedFlagUrl || (player.flagUrl && player.flagUrl.startsWith('http')
    ? player.flagUrl
    : storyCountryCodeToFlagUrl(player.flagUrl || player.countryCode || storyFindCountryForPlayer(player)?.code));
  if (flagUrl) return <img src={flagUrl} crossOrigin="anonymous" alt="" style={{ width, height, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />;

  return <span style={{ fontSize, color: '#93c5fd', fontWeight: 800, flexShrink: 0 }}>*</span>;
};
