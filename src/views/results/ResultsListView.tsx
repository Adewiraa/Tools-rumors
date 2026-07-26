'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/logic/AppContext';
import { Match, Competition } from '@/lib/mockData';
import { ChevronRight, Info, Share2, Download, X, Edit } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import {
  getEffectiveLineupStatus,
  getEffectiveMatchStatus,
  hasResultProgress,
  hasSavedHalfTimeResult,
  hasHalfTimeScoreValues,
  getResultGraphicSettings,
  getGraphicBackgroundForType,
  getMatchMediaSettings,
  getMatchTimelineEvents
} from '@/logic/utils';
import type { AppSettings, MatchMediaAdItem } from '@/logic/utils';
import { getMatchMediaPages, hasMatchMediaPage, MatchMediaPageCard } from '@/views/shared/MatchMediaAd';

type ResultOutputType = 'HT' | 'FT' | 'AD';
type ResultPreviewTarget = { type: ResultOutputType; adIndex: number };
type GeneratedResultOutput = { dataUrl: string; blob: Blob; fileName: string };
type ResultOutputCacheKey = string;
const TRANSPARENT_IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

export default function ResultsListView() {
  const router = useRouter();
  const {
    appSettings,
    matches,
    competitions,
    hasPermission,
    triggerToast
  } = useApp();

  const [selectedComp, setSelectedComp] = useState('Semua');
  const [timelineMatch, setTimelineMatch] = useState<Match | null>(null);
  const [activeResultPreview, setActiveResultPreview] = useState<ResultPreviewTarget>({ type: 'FT', adIndex: 0 });
  const [isExportingResultOutput, setIsExportingResultOutput] = useState(false);
  const [preparedOutputKeys, setPreparedOutputKeys] = useState<Set<ResultOutputCacheKey>>(new Set());
  const resultOutputCacheRef = useRef<Map<ResultOutputCacheKey, GeneratedResultOutput>>(new Map());

  const filteredMatches = matches
    .filter(match => getEffectiveLineupStatus(match) === 'Complete' || getEffectiveMatchStatus(match) === 'Finished' || hasResultProgress(match))
    .filter(match => selectedComp === 'Semua' || match.competition === selectedComp)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  const statusLabel = (s: string) => ({
    Scheduled: 'Dijadwalkan',
    Live: 'Live',
    Finished: 'Selesai',
    Postponed: 'Ditunda',
    Cancelled: 'Dibatalkan'
  }[s] || s);

  const lineupStatusLabel = (match: Match) => {
    if (getEffectiveMatchStatus(match) === 'Finished') return 'Selesai';
    const effectiveLineupStatus = getEffectiveLineupStatus(match);
    return effectiveLineupStatus === 'Complete' ? 'Siap' : effectiveLineupStatus === 'Needs Review' ? 'Review' : 'Belum';
  };

  const lineupStatusClass = (match: Match) => {
    if (getEffectiveMatchStatus(match) === 'Finished') return 'badge-success';
    const effectiveLineupStatus = getEffectiveLineupStatus(match);
    return effectiveLineupStatus === 'Complete' ? 'badge-success' : effectiveLineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft';
  };

  const renderMatchLogo = (logo?: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" className="schedule-team-logo" />
      : <span className="schedule-team-logo-text">{logo || '-'}</span>
  );

  const renderCompetitionLogo = (logo?: string, name?: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" className="schedule-competition-logo" />
      : <span className="schedule-competition-logo-text" aria-hidden="true">{logo || name?.slice(0, 2).toUpperCase() || 'KO'}</span>
  );

  const getResultOutputElementId = (matchId: string, type: ResultOutputType, adIndex = 0) => (
    type === 'AD'
      ? `result-output-card-${matchId}-ad-${adIndex + 1}`
      : `result-output-card-${matchId}-${type.toLowerCase()}`
  );
  const getResultPreviewElementId = (matchId: string, type: ResultOutputType, adIndex = 0) => (
    `${getResultOutputElementId(matchId, type, adIndex)}-preview`
  );
  const getResultOutputCacheKey = (matchId: string, type: ResultOutputType, adIndex = 0): ResultOutputCacheKey => (
    `${matchId}:${type}:${adIndex}`
  );
  const getResultOutputFileName = (match: Match, type: ResultOutputType, adIndex = 0) => (
    type === 'AD'
      ? `Result_AD_${adIndex + 1}_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`
      : `Result_${type}_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.png`
  ).replace(/[^\w.-]+/g, '_');

  const getFileExtensionFromMime = (mimeType?: string) => {
    if (!mimeType) return 'bin';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('quicktime')) return 'mov';
    if (mimeType.includes('jpeg')) return 'jpg';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    return mimeType.split('/')[1]?.split(';')[0] || 'bin';
  };

  const getMatchMediaAdSource = (ad?: MatchMediaAdItem) => (
    ad?.source || ad?.video || ad?.image || ''
  );

  const isVideoMatchMediaAd = (ad?: MatchMediaAdItem) => {
    const source = getMatchMediaAdSource(ad);
    return Boolean(
      ad?.mediaType === 'video' ||
      ad?.mimeType?.startsWith('video/') ||
      source.startsWith('data:video') ||
      /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(source)
    );
  };

  const createRawVideoAdOutput = async (match: Match, ad: MatchMediaAdItem, adIndex = 0): Promise<GeneratedResultOutput> => {
    const source = getMatchMediaAdSource(ad);
    if (!source) throw new Error('File video iklan belum siap.');

    const response = await fetch(source, { cache: 'no-cache' });
    const blob = await response.blob();
    const mimeType = ad.mimeType || blob.type || 'video/mp4';
    const extension = getFileExtensionFromMime(mimeType);
    const baseFileName = ad.fileName?.trim()
      ? ad.fileName.trim()
      : `Result_AD_${adIndex + 1}_${match.homeClubName || 'HOME'}_vs_${match.awayClubName || 'AWAY'}.${extension}`;
    const fileName = baseFileName.includes('.')
      ? baseFileName
      : `${baseFileName}.${extension}`;

    return {
      dataUrl: source.startsWith('data:') ? source : URL.createObjectURL(blob),
      blob,
      fileName: fileName.replace(/[^\w.-]+/g, '_'),
    };
  };

  const waitForOutputAssets = async (node: HTMLElement) => {
    await document.fonts?.ready;
    const images = Array.from(node.querySelectorAll('img'));
    await Promise.all(images.map(image => {
      if (image.complete && image.naturalWidth > 0) {
        return image.decode?.().catch(() => undefined) || Promise.resolve();
      }

      return new Promise<void>(resolve => {
        const done = () => resolve();
        const timer = window.setTimeout(done, 2500);
        image.addEventListener('load', () => {
          window.clearTimeout(timer);
          done();
        }, { once: true });
        image.addEventListener('error', () => {
          window.clearTimeout(timer);
          done();
        }, { once: true });
      }).then(() => image.decode?.().catch(() => undefined));
    }));
    await new Promise(resolve => window.setTimeout(resolve, 80));
  };

  const captureResultOutputNode = async (node: HTMLElement) => {
    await waitForOutputAssets(node);
    const dataUrl = await htmlToImage.toPng(node, {
      cacheBust: true,
      imagePlaceholder: TRANSPARENT_IMAGE_PLACEHOLDER,
      pixelRatio: 3,
      skipFonts: true,
      width: node.offsetWidth || 400,
      height: node.offsetHeight || 500,
      style: {
        fontFamily: 'Arial, sans-serif',
        margin: '0',
      },
      fetchRequestInit: {
        cache: 'no-cache',
      },
    });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return { dataUrl, blob };
  };

  const loadCanvasImage = (src?: string) => new Promise<HTMLImageElement | null>(resolve => {
    if (!src || !src.startsWith('http')) {
      resolve(null);
      return;
    }

    const image = new Image();
    const timer = window.setTimeout(() => resolve(null), 3500);
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    image.src = src;
  });

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string
  ) => {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  const drawCoverImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    positionX = 50,
    positionY = 50,
    zoom = 100
  ) => {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * (zoom / 100);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = x + (width - drawWidth) * (positionX / 100);
    const drawY = y + (height - drawHeight) * (positionY / 100);
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  };

  const drawImageOrText = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | null,
    fallback: string,
    x: number,
    y: number,
    size: number
  ) => {
    if (image) {
      ctx.drawImage(image, x, y, size, size);
      return;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 18px Arial, sans-serif';
    ctx.fillText(fallback || '-', x + size / 2, y + size / 2);
  };

  const createCanvasResultOutputImage = async (match: Match, type: 'HT' | 'FT'): Promise<GeneratedResultOutput> => {
    const pixelRatio = 3;
    const width = 400;
    const height = 500;
    const canvas = document.createElement('canvas');
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia.');

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const comp = competitions.find(c => c.name === match.competition);
    const resultGraphicSettings = getResultGraphicSettings(match);
    const [backgroundImage, competitionLogo, homeLogo, awayLogo, appLogo] = await Promise.all([
      loadCanvasImage(resultGraphicSettings.backgroundImage || ''),
      loadCanvasImage(comp?.logoUrl),
      loadCanvasImage(match.homeLogo),
      loadCanvasImage(match.awayLogo),
      loadCanvasImage(appSettings.appLogoSrc),
    ]);

    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, '#0a0a0a');
    baseGradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    if (backgroundImage) {
      drawCoverImage(
        ctx,
        backgroundImage,
        0,
        0,
        width,
        height,
        resultGraphicSettings.backgroundPositionX ?? 50,
        resultGraphicSettings.backgroundPositionY ?? 50,
        resultGraphicSettings.backgroundZoom ?? 100
      );
      ctx.fillStyle = `rgba(10,10,10,${Math.max((resultGraphicSettings.backgroundDim ?? 20) / 100, 0.08)})`;
      ctx.fillRect(0, 0, width, height);
    }

    const bottomGradient = ctx.createLinearGradient(0, 250, 0, height);
    bottomGradient.addColorStop(0, 'rgba(10,10,10,0)');
    bottomGradient.addColorStop(0.45, 'rgba(10,10,10,0.42)');
    bottomGradient.addColorStop(1, 'rgba(10,10,10,0.86)');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, 250, width, 250);

    const topGradient = ctx.createLinearGradient(0, 0, 0, 95);
    topGradient.addColorStop(0, 'rgba(10,10,10,0.46)');
    topGradient.addColorStop(1, 'rgba(10,10,10,0)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, 95);

    const goldGradient = ctx.createLinearGradient(0, 0, width, 0);
    goldGradient.addColorStop(0, '#c8a84b');
    goldGradient.addColorStop(0.5, '#e8cc6a');
    goldGradient.addColorStop(1, '#c8a84b');
    ctx.fillStyle = goldGradient;
    ctx.fillRect(0, 0, width, 3);

    drawImageOrText(ctx, competitionLogo, match.competition?.slice(0, 2).toUpperCase() || 'KO', 18, 22, 32);
    drawRoundedRect(ctx, 58, 26, 116, 17, 3, '#c8a84b');
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '800 8px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText((match.competition || 'PIALA PRESIDEN').toUpperCase().slice(0, 20), 66, 34.5);

    if (appLogo) {
      const logoHeight = 22;
      const ratio = appLogo.naturalWidth / Math.max(appLogo.naturalHeight, 1);
      const logoWidth = Math.min(58, logoHeight * ratio);
      ctx.drawImage(appLogo, (width - logoWidth) / 2, 315, logoWidth, logoHeight);
    }

    ctx.fillStyle = 'rgba(14, 18, 22, 0.5)';
    ctx.fillRect(0, 332, width, 118);

    drawImageOrText(ctx, homeLogo, match.homeClubName.slice(0, 1), 20, 340, 36);
    drawImageOrText(ctx, awayLogo, match.awayClubName.slice(0, 1), 344, 340, 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 12px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'left';
    ctx.fillText((match.homeClubName.split(' ')[0] || 'HOME').toUpperCase(), 66, 358);
    ctx.textAlign = 'right';
    ctx.fillText((match.awayClubName.split(' ')[0] || 'AWAY').toUpperCase(), 334, 358);
    ctx.shadowBlur = 0;

    drawRoundedRect(ctx, 166, 337, 68, 18, 3, '#c8a84b');
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '800 8px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type === 'HT' ? 'HALF TIME' : 'FULL TIME', 200, 346);

    const scoreHome = type === 'HT' ? match.halfTimeHomeScore ?? 0 : match.homeScore ?? 0;
    const scoreAway = type === 'HT' ? match.halfTimeAwayScore ?? 0 : match.awayScore ?? 0;
    ctx.fillStyle = '#e8cc6a';
    ctx.font = '900 32px Arial, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(String(scoreHome), 181, 377);
    ctx.fillText(String(scoreAway), 219, 377);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '800 12px Arial, sans-serif';
    ctx.fillText('-', 200, 374);
    ctx.shadowBlur = 0;

    const hasHalfTimeScore = hasSavedHalfTimeResult(match) &&
      match.halfTimeHomeScore !== undefined && match.halfTimeHomeScore !== null &&
      match.halfTimeAwayScore !== undefined && match.halfTimeAwayScore !== null;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      type === 'FT' && hasHalfTimeScore ? `HALF TIME: ${match.halfTimeHomeScore} - ${match.halfTimeAwayScore}` : (match.venue || 'Stadion Pertandingan'),
      200,
      408
    );

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 428);
    ctx.lineTo(380, 428);
    ctx.stroke();

    type TimelineOutputEvent = { id?: string; minute?: number; type?: string; playerName?: string; clubId?: string };
    const events = (getMatchTimelineEvents(match.timeline) as TimelineOutputEvent[]).slice().sort((a, b) => (a.minute || 0) - (b.minute || 0));
    const goalEvents = events.filter(event => event.type === 'goal' && (type === 'FT' || (event.minute || 0) <= 45));
    ctx.font = '700 9px Arial, sans-serif';
    ctx.textAlign = 'left';
    goalEvents.slice(0, 5).forEach((event, index) => {
      ctx.fillStyle = '#c8a84b';
      ctx.fillText(`${event.minute || 0}'`, 20, 444 + index * 15);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Goal ${event.playerName || ''}`, 42, 444 + index * 15);
    });

    if (goalEvents.length === 0) {
      ctx.fillStyle = '#a0aec0';
      ctx.textAlign = 'center';
      ctx.font = 'italic 9px Arial, sans-serif';
      ctx.fillText('Tidak ada gol tercipta', 200, 446);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(20, 470);
    ctx.lineTo(380, 470);
    ctx.stroke();
    ctx.fillStyle = '#a0aec0';
    ctx.font = '700 8px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(appSettings.appHandle || '@mediatools', 20, 486);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) resolve(result);
        else reject(new Error('Gagal membuat blob canvas.'));
      }, 'image/png', 1);
    });

    return {
      dataUrl: canvas.toDataURL('image/png'),
      blob,
      fileName: getResultOutputFileName(match, type),
    };
  };

  const createResultOutputImage = async (match: Match, type: ResultOutputType, adIndex = 0): Promise<GeneratedResultOutput> => {
    if (type === 'AD') {
      const ad = getMatchMediaPages(getMatchMediaSettings(match))[adIndex];
      if (isVideoMatchMediaAd(ad)) {
        return createRawVideoAdOutput(match, ad, adIndex);
      }
    }

    const outputNode = document.getElementById(getResultOutputElementId(match.id, type, adIndex));
    const previewNode = document.getElementById(getResultPreviewElementId(match.id, type, adIndex));
    const fileName = getResultOutputFileName(match, type, adIndex);

    if (!outputNode && !previewNode && type !== 'HT' && type !== 'FT') {
      throw new Error(type === 'AD' ? 'Halaman iklan belum siap.' : 'Gambar hasil belum siap.');
    }

    let dataUrl = '';
    let blob: Blob;

    try {
      const captured = await captureResultOutputNode((outputNode || previewNode) as HTMLElement);
      dataUrl = captured.dataUrl;
      blob = captured.blob;
    } catch (error) {
      if (previewNode && previewNode !== outputNode) {
        try {
          console.warn('Hidden result output capture failed, retrying visible preview:', error);
          const captured = await captureResultOutputNode(previewNode);
          dataUrl = captured.dataUrl;
          blob = captured.blob;
        } catch (previewError) {
          if (type !== 'HT' && type !== 'FT') throw previewError;
          console.warn('Visible result output capture failed, falling back to canvas:', previewError);
          return createCanvasResultOutputImage(match, type);
        }
      } else {
        if (type !== 'HT' && type !== 'FT') throw error;
        console.warn('Result output DOM capture failed, falling back to canvas:', error);
        return createCanvasResultOutputImage(match, type);
      }
    }

    return { dataUrl, blob, fileName };
  };

  const prepareResultOutputImage = async (match: Match, type: ResultOutputType, adIndex = 0) => {
    const key = getResultOutputCacheKey(match.id, type, adIndex);
    const cached = resultOutputCacheRef.current.get(key);
    if (cached) return cached;

    const output = await createResultOutputImage(match, type, adIndex);
    resultOutputCacheRef.current.set(key, output);
    setPreparedOutputKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    return output;
  };

  const downloadGeneratedOutputs = (outputs: Pick<GeneratedResultOutput, 'dataUrl' | 'fileName'>[]) => {
    outputs.forEach(output => {
      const link = document.createElement('a');
      link.download = output.fileName;
      link.href = output.dataUrl;
      link.click();
    });
  };

  const canShareFiles = (nav: Navigator & { canShare?: (data: ShareData) => boolean }, shareData: ShareData) => {
    try {
      return typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare(shareData);
    } catch (error) {
      console.warn('Result output canShare check failed:', error);
      return false;
    }
  };

  const collectResultShareOutputs = async (match: Match, type: ResultOutputType, adIndex = 0) => {
    const getOutput = async (outputType: ResultOutputType, outputAdIndex = 0) => {
      const key = getResultOutputCacheKey(match.id, outputType, outputAdIndex);
      return resultOutputCacheRef.current.get(key) || await prepareResultOutputImage(match, outputType, outputAdIndex);
    };

    const outputs = [await getOutput(type, adIndex)];

    if (type !== 'AD') {
      const mediaPages = getMatchMediaPages(getMatchMediaSettings(match));
      for (let index = 0; index < mediaPages.length; index += 1) {
        try {
          outputs.push(await getOutput('AD', index));
        } catch (error) {
          console.warn(`Media ad ${index + 1} output skipped from share package:`, error);
        }
      }
    }

    return outputs;
  };

  const copyResultOutputsToClipboard = async (outputs: GeneratedResultOutput[]) => {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') return false;

    try {
      await navigator.clipboard.write(outputs.map(output => (
        new ClipboardItem({ [output.blob.type || 'image/png']: output.blob })
      )));
      return { copiedCount: outputs.length };
    } catch (error) {
      console.warn('Result output clipboard fallback failed:', error);

      if (outputs.length <= 1) return false;

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [outputs[0].blob.type || 'image/png']: outputs[0].blob }),
        ]);
        return { copiedCount: 1 };
      } catch (singleError) {
        console.warn('Single result output clipboard fallback failed:', singleError);
        return false;
      }
    }
  };

  const downloadResultOutput = async (match: Match, type: ResultOutputType, adIndex = 0) => {
    const outputLabel = type === 'AD' ? `iklan ${adIndex + 1}` : type;
    try {
      setIsExportingResultOutput(true);
      triggerToast(`Membuat gambar ${outputLabel}...`);
      const { dataUrl, fileName } = await createResultOutputImage(match, type, adIndex);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      triggerToast(`Gambar ${outputLabel} berhasil diunduh!`);
    } catch (err) {
      console.warn('Result output download failed:', err);
      triggerToast(`Gagal mengunduh gambar ${outputLabel}.`, 'error');
    } finally {
      setIsExportingResultOutput(false);
    }
  };

  const shareResultOutput = async (match: Match, type: ResultOutputType, adIndex = 0) => {
    const outputLabel = type === 'AD' ? `Iklan ${adIndex + 1}` : type;

    try {
      setIsExportingResultOutput(true);
      triggerToast(type === 'AD' ? `Membuat gambar ${outputLabel}...` : `Membuat paket gambar ${outputLabel} dan iklan...`);
      const outputs = await collectResultShareOutputs(match, type, adIndex);
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const files = outputs.map(output => new File([output.blob], output.fileName, { type: output.blob.type || 'image/png' }));
      const shareData: ShareData = {
        files,
        title: `${outputLabel} ${match.homeClubName} vs ${match.awayClubName}`,
        text: type === 'AD'
          ? `Halaman iklan ${match.homeClubName} vs ${match.awayClubName}`
          : `Hasil ${type} ${match.homeClubName} vs ${match.awayClubName}${outputs.length > 1 ? ' + media iklan' : ''}`,
      };

      if (canShareFiles(nav, shareData)) {
        try {
          const sharePromise = nav.share(shareData);
          setIsExportingResultOutput(true);
          await sharePromise;
          triggerToast(outputs.length > 1 ? `Gambar ${outputLabel} dan media iklan siap dibagikan.` : `Gambar ${outputLabel} siap dibagikan.`);
          return;
        } catch (shareError) {
          const error = shareError as { name?: string };
          if (error?.name === 'AbortError') return;
          console.warn('Result output native share failed, falling back to download:', shareError);
        }
      }

      const clipboardResult = await copyResultOutputsToClipboard(outputs);
      if (clipboardResult) {
        triggerToast(
          clipboardResult.copiedCount === outputs.length
            ? `Gambar ${outputLabel}${outputs.length > 1 ? ' dan iklan' : ''} disalin ke clipboard. Tinggal paste ke aplikasi tujuan.`
            : `Gambar ${outputLabel} disalin ke clipboard. Perangkat ini belum mendukung clipboard multi-gambar untuk iklan.`,
          clipboardResult.copiedCount === outputs.length ? 'success' : 'warning'
        );
        return;
      }

      downloadGeneratedOutputs(outputs);
      triggerToast('Share langsung belum didukung di perangkat ini. PNG diunduh sebagai fallback.', 'warning');
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.warn('Result output share failed:', err);
        triggerToast(`Gagal membuat gambar ${outputLabel}. Coba tombol Unduh.`, 'error');
      }
    } finally {
      setIsExportingResultOutput(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/results?edit=${id}`);
  };

  const canShowHalfTimeOutput = (match: Match) => (
    hasSavedHalfTimeResult(match) &&
    match.halfTimeHomeScore !== undefined &&
    match.halfTimeHomeScore !== null &&
    match.halfTimeAwayScore !== undefined &&
    match.halfTimeAwayScore !== null
  );

  const canShowFullTimeOutput = (match: Match) => (
    match.homeScore !== undefined &&
    match.homeScore !== null &&
    match.awayScore !== undefined &&
    match.awayScore !== null
  );

  const openResultPreview = (match: Match) => {
    resultOutputCacheRef.current.clear();
    setPreparedOutputKeys(new Set());
    setTimelineMatch(match);
    setActiveResultPreview({ type: canShowHalfTimeOutput(match) ? 'HT' : 'FT', adIndex: 0 });
  };

  useEffect(() => {
    if (!timelineMatch) return;

    resultOutputCacheRef.current.clear();
    setPreparedOutputKeys(new Set());
  }, [timelineMatch?.id]);

  useEffect(() => {
    if (!timelineMatch) return;

    const outputTargets: ResultPreviewTarget[] = [];
    if (canShowHalfTimeOutput(timelineMatch)) outputTargets.push({ type: 'HT', adIndex: 0 });
    if (canShowFullTimeOutput(timelineMatch)) outputTargets.push({ type: 'FT', adIndex: 0 });
    getMatchMediaPages(getMatchMediaSettings(timelineMatch)).forEach((_, index) => {
      outputTargets.push({ type: 'AD', adIndex: index });
    });

    const timer = window.setTimeout(() => {
      outputTargets.forEach(target => {
        void prepareResultOutputImage(timelineMatch, target.type, target.adIndex).catch(error => {
          console.warn(`Result output ${target.type} preparation failed:`, error);
        });
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [timelineMatch, appSettings, competitions]);

  return (
    <div className="schedule-page-root">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Hasil Pertandingan</span>
          </div>
          <h1 className="page-title">Hasil Pertandingan</h1>
          <p className="page-description">Kelola skor akhir, timeline pencetak gol, status adu penalti, dan status review pertandingan.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card schedule-filter-card">
        <select className="form-select schedule-filter-competition" value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
          <option value="Semua">Semua Kompetisi</option>
          {competitions.map(comp => (
            <option key={comp.id} value={comp.name}>{comp.name}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="table-wrapper schedule-table-wrapper">
        <table className="data-table schedule-table">
          <thead>
            <tr>
              <th>Pertandingan</th>
              <th>Kompetisi</th>
              <th>Kickoff</th>
              <th>HT</th>
              <th>FT</th>
              <th>Status</th>
              <th>Lineup</th>
              <th>Publikasi</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map(match => {
              const effectiveStatus = getEffectiveMatchStatus(match);
              const hasSavedHalfTime = hasSavedHalfTimeResult(match);
              const competition = competitions.find(c => c.name === match.competition);
              const kickoffDate = new Date(match.kickoff);
              const kickoffDateLabel = kickoffDate.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
              const kickoffTimeLabel = kickoffDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              const canInputResult = (effectiveStatus === 'Live' || effectiveStatus === 'Finished' || hasSavedHalfTime) && (getEffectiveLineupStatus(match) === 'Complete' || hasSavedHalfTime || effectiveStatus === 'Finished');
              return (
                <tr key={match.id}>
                  <td className="schedule-match-cell">
                    <div className="schedule-match-teams">
                      <span className="schedule-team schedule-team-home">
                        {renderMatchLogo(match.homeLogo)}
                        <span className="schedule-team-name">{match.homeClubName}</span>
                      </span>
                      <span className="schedule-versus">vs</span>
                      <span className="schedule-team schedule-team-away">
                        {renderMatchLogo(match.awayLogo)}
                        <span className="schedule-team-name">{match.awayClubName}</span>
                      </span>
                    </div>
                  </td>
                  <td className="schedule-info-cell" data-label="Kompetisi">
                    <span className="schedule-competition-value">
                      {renderCompetitionLogo(competition?.logoUrl, match.competition)}
                      <span>{match.competition}</span>
                    </span>
                  </td>
                  <td className="schedule-info-cell schedule-kickoff-cell" data-label="Kickoff">
                    <span className="schedule-kickoff-value">{kickoffDateLabel}, {kickoffTimeLabel} WIB</span>
                  </td>
                  <td className="schedule-info-cell" data-label="HT">
                    {hasSavedHalfTime && hasHalfTimeScoreValues(match) ? (
                      <span className="schedule-score schedule-score-half">{match.halfTimeHomeScore} - {match.halfTimeAwayScore}</span>
                    ) : (
                      <span className="schedule-empty-score">-</span>
                    )}
                  </td>
                  <td className="schedule-info-cell" data-label="FT">
                    {match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null ? (
                      <span className="schedule-score schedule-score-full">{match.homeScore} - {match.awayScore}</span>
                    ) : (
                      <span className="schedule-empty-score">-</span>
                    )}
                  </td>
                  <td className="schedule-info-cell" data-label="Status">
                    <span className={`badge ${effectiveStatus === 'Finished' ? 'badge-success' : effectiveStatus === 'Live' ? 'badge-danger' : 'badge-warning'}`}>
                      {statusLabel(effectiveStatus)}
                    </span>
                  </td>
                  <td className="schedule-info-cell" data-label="Lineup">
                    <span className={`badge ${lineupStatusClass(match)}`}>
                      {lineupStatusLabel(match)}
                    </span>
                  </td>
                  <td className="schedule-info-cell" data-label="Publikasi">
                    <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                      {match.publicationStatus}
                    </span>
                  </td>
                  <td className="schedule-actions-cell text-right">
                    <div className="schedule-actions" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      {hasPermission('Match Result', 'create_edit') && (
                        <button 
                          className="btn btn-sm btn-primary" 
                          disabled={!canInputResult} 
                          title={canInputResult ? 'Input / Edit Hasil Pertandingan' : 'Input hasil tersedia saat pertandingan Live dan lineup lengkap'} 
                          onClick={() => handleEdit(match.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Edit size={13} /> {hasResultProgress(match) ? (match.homeScore !== undefined && match.homeScore !== null ? 'Edit Skor' : 'Input FT') : 'Input HT/FT'}
                        </button>
                      )}
                      {hasResultProgress(match) && (
                        <button className="btn btn-sm btn-secondary" onClick={() => openResultPreview(match)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Info size={13} /> Lihat Gambar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {timelineMatch && (
        <div className="modal-overlay">
          <div className="modal-content output-preview-modal">
            <div className="output-preview-header">
              <div>
                <h3 className="output-preview-title">Gambar Hasil Pertandingan</h3>
                <div className="output-preview-meta">{timelineMatch.homeClubName} vs {timelineMatch.awayClubName}</div>
              </div>
              <button className="btn btn-sm btn-secondary output-preview-close" title="Tutup" onClick={() => setTimelineMatch(null)}><X size={16} /></button>
            </div>
            <div className="output-preview-tabs" role="tablist" aria-label="Pilihan gambar hasil">
              {canShowHalfTimeOutput(timelineMatch) && (
                <button
                  type="button"
                  className={`output-preview-tab ${activeResultPreview.type === 'HT' ? 'active' : ''}`}
                  onClick={() => setActiveResultPreview({ type: 'HT', adIndex: 0 })}
                >
                  Half Time
                </button>
              )}
              {canShowFullTimeOutput(timelineMatch) && (
                <button
                  type="button"
                  className={`output-preview-tab ${activeResultPreview.type === 'FT' ? 'active' : ''}`}
                  onClick={() => setActiveResultPreview({ type: 'FT', adIndex: 0 })}
                >
                  Full Time
                </button>
              )}
              {getMatchMediaPages(getMatchMediaSettings(timelineMatch)).map((ad, index) => (
                <button
                  type="button"
                  key={ad.id || index}
                  className={`output-preview-tab ${activeResultPreview.type === 'AD' && activeResultPreview.adIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveResultPreview({ type: 'AD', adIndex: index })}
                >
                  Media Iklan {index + 1}
                </button>
              ))}
            </div>
            <div className="output-preview-stage">
              {(() => {
                const mediaAdPages = getMatchMediaPages(getMatchMediaSettings(timelineMatch));
                const activeAd = mediaAdPages[activeResultPreview.adIndex] || mediaAdPages[0];
                const isActiveAd = activeResultPreview.type === 'AD' && activeAd;
                const activeType = isActiveAd ? 'AD' : activeResultPreview.type === 'HT' && canShowHalfTimeOutput(timelineMatch) ? 'HT' : 'FT';
                const activeGraphicType: 'HT' | 'FT' = activeType === 'HT' ? 'HT' : 'FT';
                const activeLabel = activeType === 'HT' ? 'Half Time' : activeType === 'FT' ? 'Full Time' : `Media Iklan ${activeResultPreview.adIndex + 1}`;
                const activeOutputReady = preparedOutputKeys.has(getResultOutputCacheKey(timelineMatch.id, activeType, activeResultPreview.adIndex));

                return (
                  <div className="output-preview-item output-preview-active-card">
                    <div className="output-preview-item-label">{activeLabel}</div>
                    {activeType === 'AD' && activeAd ? (
                      <ResultOutputAdCard
                        match={timelineMatch}
                        competitions={competitions}
                        elementId={getResultPreviewElementId(timelineMatch.id, 'AD', activeResultPreview.adIndex)}
                        appSettings={appSettings}
                        ad={activeAd}
                        adIndex={activeResultPreview.adIndex}
                        adTotal={mediaAdPages.length}
                      />
                    ) : (
                      <ResultOutputGraphicCard
                        match={timelineMatch}
                        competitions={competitions}
                        elementId={getResultPreviewElementId(timelineMatch.id, activeGraphicType)}
                        graphicType={activeGraphicType}
                        appSettings={appSettings}
                      />
                    )}
                    <div className="output-preview-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => shareResultOutput(timelineMatch, activeType, activeResultPreview.adIndex)}
                        disabled={isExportingResultOutput || !activeOutputReady}
                        title={activeOutputReady ? `Bagikan ${activeType}` : 'File share sedang disiapkan'}
                      >
                        <Share2 size={14} /> {activeOutputReady ? `Bagikan ${activeType === 'AD' ? 'Iklan' : activeType}` : 'Menyiapkan file...'}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => downloadResultOutput(timelineMatch, activeType, activeResultPreview.adIndex)}
                        disabled={isExportingResultOutput}
                      >
                        <Download size={14} /> Unduh {activeType === 'AD' ? 'Iklan' : activeType}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="result-output-export-deck" aria-hidden="true">
              {canShowHalfTimeOutput(timelineMatch) && (
                <ResultOutputGraphicCard
                  match={timelineMatch}
                  competitions={competitions}
                  elementId={getResultOutputElementId(timelineMatch.id, 'HT')}
                  graphicType="HT"
                  appSettings={appSettings}
                />
              )}
              {canShowFullTimeOutput(timelineMatch) && (
                <ResultOutputGraphicCard
                  match={timelineMatch}
                  competitions={competitions}
                  elementId={getResultOutputElementId(timelineMatch.id, 'FT')}
                  graphicType="FT"
                  appSettings={appSettings}
                />
              )}
              {getMatchMediaPages(getMatchMediaSettings(timelineMatch)).map((ad, index) => (
                <ResultOutputAdCard
                  key={ad.id || index}
                  match={timelineMatch}
                  competitions={competitions}
                  elementId={getResultOutputElementId(timelineMatch.id, 'AD', index)}
                  appSettings={appSettings}
                  ad={ad}
                  adIndex={index}
                  adTotal={getMatchMediaPages(getMatchMediaSettings(timelineMatch)).length}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultOutputGraphicCard({ match, competitions, elementId, graphicType, appSettings }: {
  match: Match;
  competitions: Competition[];
  elementId: string;
  graphicType: 'HT' | 'FT';
  appSettings: AppSettings;
}) {
  type TimelineOutputEvent = { id?: string; minute?: number; type?: string; playerName?: string; clubId?: string };
  const events = (getMatchTimelineEvents(match.timeline) as TimelineOutputEvent[]).slice().sort((a, b) => (a.minute || 0) - (b.minute || 0));
  const goalEvents = events.filter(event => event.type === 'goal' && (graphicType === 'FT' || (event.minute || 0) <= 45));
  const comp = competitions.find(c => c.name === match.competition);
  const resultGraphicSettings = getResultGraphicSettings(match);
  const bgObj = getGraphicBackgroundForType(resultGraphicSettings, graphicType);
  const backgroundImage = bgObj.image;
  const backgroundPositionX = bgObj.positionX;
  const backgroundPositionY = bgObj.positionY;
  const backgroundZoom = bgObj.zoom;
  const backgroundDim = bgObj.dim;
  const scoreHome = graphicType === 'HT' ? match.halfTimeHomeScore ?? 0 : match.homeScore ?? 0;
  const scoreAway = graphicType === 'HT' ? match.halfTimeAwayScore ?? 0 : match.awayScore ?? 0;
  const hasHalfTimeScore = hasSavedHalfTimeResult(match) &&
    match.halfTimeHomeScore !== undefined && match.halfTimeHomeScore !== null &&
    match.halfTimeAwayScore !== undefined && match.halfTimeAwayScore !== null;
  const renderLogo = (logo: string, fallback: string) => (
    logo && logo.startsWith('http')
      ? <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: 'contain' }} />
      : <span style={{ fontSize: 24 }}>{logo || fallback}</span>
  );

  return (
    <div id={elementId} style={{
      width: 400,
      height: 500,
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 16,
      boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {backgroundImage ? (
        <>
          <img
            src={backgroundImage}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
              transform: `scale(${backgroundZoom / 100})`,
              transformOrigin: `${backgroundPositionX}% ${backgroundPositionY}%`,
              zIndex: 0,
            }}
          />
          {/* Subtle bottom scoreboard overlay for legibility on light background images */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '180px',
              background: 'linear-gradient(to top, rgba(10, 10, 10, 0.7) 0%, rgba(10, 10, 10, 0.35) 50%, rgba(10, 10, 10, 0) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
          {/* Subtle top header overlay for legibility on light background images */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.45) 0%, rgba(10, 10, 10, 0) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(rgba(10, 10, 10, ${Math.max(backgroundDim - 12, 0) / 100}) 0%, rgba(10, 10, 10, ${backgroundDim / 100}) 45%, rgba(10, 10, 10, ${Math.min(backgroundDim + 45, 85) / 100}) 90%)`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(200,168,75,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
        </>
      )}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)', zIndex: 3 }} />

      <div style={{
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: '8px 0',
        marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {comp?.logoUrl && comp.logoUrl.startsWith('http')
            ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
            : <div style={{ width: 18, height: 18, background: 'rgba(10, 10, 10, 0.65)', borderRadius: 3, border: '1px solid rgba(200,168,75,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.35)' }}>
                <div style={{ width: 6, height: 6, background: '#c8a84b', borderRadius: 1 }} />
              </div>}
          <span style={{ 
            fontSize: 8, 
            fontWeight: 800, 
            backgroundColor: '#c8a84b',
            color: '#0a0a0a',
            padding: '2px 6px',
            borderRadius: 3,
            letterSpacing: 0.5, 
            textTransform: 'uppercase', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            display: 'inline-block',
            maxWidth: 120,
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}>
            {match.competition || 'LIGA NUSANTARA UTAMA'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        zIndex: 2,
        backgroundColor: 'transparent',
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {renderLogo(match.homeLogo, 'H')}
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.7)' }}>
              {match.homeClubName.split(' ')[0] || 'HOME'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {appSettings.appLogoSrc && (
              <img src={appSettings.appLogoSrc} alt={appSettings.appName} style={{ height: 22, objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))', marginBottom: 2 }} />
            )}
            <span style={{ fontSize: 8, fontWeight: 800, backgroundColor: '#c8a84b', color: '#0a0a0a', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {graphicType === 'HT' ? 'HALF TIME' : 'FULL TIME'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', justifyContent: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' }}>{scoreHome}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#e2e8f0', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>-</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#e8cc6a', textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' }}>{scoreAway}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {renderLogo(match.awayLogo, 'A')}
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right', textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.7)' }}>
              {match.awayClubName.split(' ')[0] || 'AWAY'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 6, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
          {graphicType === 'FT' && hasHalfTimeScore
            ? `HALF TIME: ${match.halfTimeHomeScore} - ${match.halfTimeAwayScore}`
            : (match.venue || 'Stadion Pertandingan')}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, width: '100%', fontSize: 9 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {goalEvents
              .filter(event => String(event.clubId) === String(match.homeClubId))
              .map((event, index) => (
                <div key={event.id || `home-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  <span style={{ color: '#c8a84b', fontWeight: 700 }}>{`${event.minute || 0}'`}</span>
                  <span>Goal {event.playerName}</span>
                </div>
              ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
            {goalEvents
              .filter(event => String(event.clubId) === String(match.awayClubId))
              .map((event, index) => (
                <div key={event.id || `away-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', flexDirection: 'row-reverse', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  <span style={{ color: '#c8a84b', fontWeight: 700 }}>{`${event.minute || 0}'`}</span>
                  <span>{event.playerName} Goal</span>
                </div>
              ))}
          </div>
        </div>
        {goalEvents.length === 0 && (
          <div style={{ fontSize: 9, color: '#a0aec0', textAlign: 'center', fontStyle: 'italic', padding: '2px 0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>Tidak ada gol tercipta</div>
        )}
      </div>

      <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 6, fontSize: 8, color: '#a0aec0', fontWeight: 600, marginTop: 8, width: '100%', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
        <span>{appSettings.appHandle}</span>
      </div>
    </div>
  );
}

function ResultOutputAdCard({ match, competitions, elementId, appSettings, ad, adIndex, adTotal }: {
  match: Match;
  competitions: Competition[];
  elementId: string;
  appSettings: AppSettings;
  ad: MatchMediaAdItem;
  adIndex: number;
  adTotal: number;
}) {
  const comp = competitions.find(c => c.name === match.competition);
  const resultGraphicSettings = getResultGraphicSettings(match);

  return (
    <MatchMediaPageCard
      elementId={elementId}
      settings={getMatchMediaSettings(match)}
      ad={ad}
      width={400}
      height={500}
      appSettings={appSettings}
      competitionName={match.competition}
      competitionLogo={comp?.logoUrl}
      matchTitle={`${match.homeClubName} vs ${match.awayClubName}`}
      backgroundImage={resultGraphicSettings.backgroundImage || null}
      backgroundPositionX={resultGraphicSettings.backgroundPositionX ?? 50}
      backgroundPositionY={resultGraphicSettings.backgroundPositionY ?? 50}
      backgroundZoom={resultGraphicSettings.backgroundZoom ?? 100}
      backgroundDim={resultGraphicSettings.backgroundDim ?? 20}
      slideIndex={adIndex + 1}
      slideTotal={adTotal}
    />
  );
}
