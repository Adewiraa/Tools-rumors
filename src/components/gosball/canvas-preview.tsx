"use client";

import { forwardRef } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Goal,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { FlagBadge } from "@/components/gosball/flag-badge";
import { formationTemplates } from "@/lib/gosball-fixtures";
import type {
  CanvasAspectRatio,
  FormationCoordinate,
  MatchdayLineupData,
  TeamLineup,
  ToolMode,
  TransferRumorData,
} from "@/types/gosball";

interface CanvasPreviewProps {
  mode: ToolMode;
  aspectRatio: CanvasAspectRatio;
  lineupData: MatchdayLineupData;
  rumorData: TransferRumorData;
}

export const CanvasPreview = forwardRef<HTMLDivElement, CanvasPreviewProps>(
  function CanvasPreview({ mode, aspectRatio, lineupData, rumorData }, ref) {
    const canvasSizeClass =
      aspectRatio === "1:1"
        ? "aspect-square w-full max-w-[780px]"
        : "aspect-[9/16] w-full max-w-[430px]";

    return (
      <div className="flex w-full items-center justify-center">
        <div
          ref={ref}
          className={`relative overflow-hidden rounded-[1.75rem] border border-[#f3efe2]/10 bg-[#0b0d0b] text-[#f3efe2] shadow-2xl shadow-black/60 ${canvasSizeClass}`}
        >
          <CanvasBackground />
          {mode === "lineup" ? (
            <LineupPoster aspectRatio={aspectRatio} lineupData={lineupData} />
          ) : (
            <RumorPoster aspectRatio={aspectRatio} rumorData={rumorData} />
          )}
        </div>
      </div>
    );
  },
);

function CanvasBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(243,239,226,0.1),transparent_19rem),radial-gradient(circle_at_88%_28%,rgba(183,255,90,0.12),transparent_18rem),linear-gradient(145deg,#181b16_0%,#0b0d0b_46%,#11150f_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full border border-white/10" />
      <div className="absolute -right-28 bottom-6 h-80 w-80 rounded-full border border-[#b7ff5a]/10" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.26))]" />
    </>
  );
}

function LineupPoster({
  aspectRatio,
  lineupData,
}: {
  aspectRatio: CanvasAspectRatio;
  lineupData: MatchdayLineupData;
}) {
  if (aspectRatio === "9:16") {
    return <LineupStoryPoster lineupData={lineupData} />;
  }

  return <LineupFeedPoster lineupData={lineupData} />;
}

function LineupFeedPoster({ lineupData }: { lineupData: MatchdayLineupData }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col p-[4.6%]">
      <LineupHeader lineupData={lineupData} compact={false} />

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-3">
        <TeamSheet team={lineupData.homeTeam} side="home" layout="feed" />
        <TeamSheet team={lineupData.awayTeam} side="away" layout="feed" />
      </div>

      <LineupFooter lineupData={lineupData} />
    </div>
  );
}

function LineupStoryPoster({ lineupData }: { lineupData: MatchdayLineupData }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col p-[4.4%]">
      <LineupHeader lineupData={lineupData} compact />

      <div className="mt-3 grid min-h-0 flex-1 grid-rows-2 gap-2.5">
        <StoryTeamRosterCard team={lineupData.homeTeam} side="home" />
        <StoryTeamRosterCard team={lineupData.awayTeam} side="away" />
      </div>

      <LineupFooter lineupData={lineupData} compact />
    </div>
  );
}

function LineupHeader({
  lineupData,
  compact,
}: {
  lineupData: MatchdayLineupData;
  compact: boolean;
}) {
  return (
    <header className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="studio-label text-[#b7ff5a]">
          Gosball Match Sheet
        </p>
        <h2
          className={`display-type mt-2 font-black uppercase leading-[0.86] tracking-[-0.075em] [overflow-wrap:anywhere] ${
            compact
              ? "text-[clamp(1.65rem,9vw,2.7rem)]"
              : "text-[clamp(2.5rem,6vw,4.8rem)]"
          }`}
        >
          {lineupData.homeTeam.shortName}
          <span className="mx-2 text-[#b7ff5a]">/</span>
          <wbr />
          {lineupData.awayTeam.shortName}
        </h2>
        <div className={compact ? "mt-2 flex flex-wrap items-center gap-1.5 text-[0.5rem] font-black uppercase tracking-[0.16em] text-[#c8c2b2]" : "mt-3 flex flex-wrap items-center gap-2 text-[0.56rem] font-black uppercase tracking-[0.2em] text-[#c8c2b2]"}>
          <span>{lineupData.competitionName}</span>
          <span className="h-1 w-1 rounded-full bg-[#b7ff5a]" />
          <span>{lineupData.matchLabel}</span>
          {lineupData.venue ? (
            <>
              <span className="h-1 w-1 rounded-full bg-[#b7ff5a]" />
              <span>{lineupData.venue}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className={compact ? "glass-edge shrink-0 rounded-[1rem] px-2 py-2 text-right" : "glass-edge shrink-0 rounded-[1.35rem] px-3 py-3 text-right"}>
        <ScanLine className="ml-auto h-4 w-4 text-[#b7ff5a]" />
        <p className="mt-2 text-[0.5rem] font-black uppercase tracking-[0.28em] text-[#9d9a90]">
          XI
        </p>
        <p className={compact ? "text-lg font-black leading-none text-[#f3efe2]" : "text-xl font-black leading-none text-[#f3efe2]"}>22</p>
      </div>
    </header>
  );
}

function StoryTeamRosterCard({
  team,
  side,
}: {
  team: TeamLineup;
  side: "home" | "away";
}) {
  return (
    <section className="relative min-h-0 overflow-hidden rounded-[1.1rem] border border-[#f3efe2]/10 bg-[#11140f]/88 shadow-xl shadow-black/25">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: team.primaryColor }}
      />
      <div className="relative z-10 flex h-full min-h-0 flex-col p-2.5">
        <div className="mb-1.5 grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <TeamLogo team={team} compact />
          <div className="min-w-0">
            <h3 className="truncate text-xs font-black uppercase tracking-[-0.03em]">
              {team.name}
            </h3>
            <p className="truncate text-[0.46rem] font-black uppercase tracking-[0.14em] text-[#9d9a90]">
              {team.formation} / Coach {team.coach.name}
            </p>
          </div>
          <span className="rounded-md border border-[#f3efe2]/10 bg-[#f3efe2]/[0.06] px-1.5 py-0.5 text-[0.46rem] font-black uppercase tracking-[0.14em] text-[#c8c2b2]">
            {side}
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1.05fr_0.95fr] gap-2">
          <RosterColumn
            title="Starting XI"
            players={team.starters}
            teamColor={team.primaryColor}
            variant="story-starter"
          />
          <RosterColumn
            title="Cadangan"
            players={team.substitutes}
            teamColor={team.primaryColor}
            variant="story-bench"
          />
        </div>
      </div>
    </section>
  );
}

function TeamSheet({
  team,
  side,
  layout,
}: {
  team: TeamLineup;
  side: "home" | "away";
  layout: "feed" | "story";
}) {
  const isStory = layout === "story";

  return (
    <section className="relative min-h-0 overflow-hidden rounded-[1.45rem] border border-[#f3efe2]/10 bg-[#11140f]/88 shadow-xl shadow-black/25">
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: team.primaryColor }}
      />
      <div className={`relative z-10 flex h-full min-h-0 flex-col ${isStory ? "p-2.5" : "p-3"}`}>
        <div className={isStory ? "mb-1.5 flex items-center justify-between gap-2" : "mb-2 flex items-center justify-between gap-3"}>
          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo team={team} compact={isStory} />
            <div className="min-w-0">
              <h3 className={isStory ? "truncate text-xs font-black uppercase tracking-[-0.03em]" : "truncate text-sm font-black uppercase tracking-[-0.04em]"}>
                {team.name}
              </h3>
              <p className={isStory ? "text-[0.48rem] font-black uppercase tracking-[0.16em] text-[#9d9a90]" : "text-[0.55rem] font-black uppercase tracking-[0.22em] text-[#9d9a90]"}>
                {team.formation} / Coach {team.coach.name}
              </p>
            </div>
          </div>
          <span className={isStory ? "rounded-md border border-[#f3efe2]/10 bg-[#f3efe2]/[0.06] px-1.5 py-0.5 text-[0.48rem] font-black uppercase tracking-[0.14em] text-[#c8c2b2]" : "rounded-md border border-[#f3efe2]/10 bg-[#f3efe2]/[0.06] px-2 py-1 text-[0.55rem] font-black uppercase tracking-[0.18em] text-[#c8c2b2]"}>
            {side === "home" ? "Home" : "Away"}
          </span>
        </div>

        <div
          className={`grid min-h-0 flex-1 gap-3 ${
            isStory ? "grid-cols-[36%_1fr] gap-2" : "grid-rows-[46%_1fr]"
          }`}
        >
          <TacticalPitch team={team} side={side} compact={isStory} />
          <div className={isStory ? "min-h-0 overflow-hidden rounded-[0.85rem] border border-[#f3efe2]/10 bg-black/10 p-1.5" : "min-h-0 overflow-hidden rounded-[1rem] border border-[#f3efe2]/10 bg-black/20 p-2"}>
            <PlayerSheetList team={team} layout={layout} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TacticalPitch({
  team,
  side,
  compact,
}: {
  team: TeamLineup;
  side: "home" | "away";
  compact: boolean;
}) {
  const formation = formationTemplates[team.formation];
  const coordinates =
    side === "home"
      ? formation.coordinates
      : formation.coordinates.map(mirrorCoordinate);

  return (
    <div className="relative min-h-0 overflow-hidden rounded-[1rem] border border-[#f3efe2]/10 bg-[linear-gradient(180deg,rgba(183,255,90,0.06),rgba(12,14,12,0.24))]">
      <div className="absolute inset-2 rounded-xl border border-white/10" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:26px_26px]" />

      {coordinates.map((coordinate, index) => {
        const player = team.starters[index];

        return (
          <PlayerNumber
            key={`${team.id}-${coordinate.id}`}
            color={team.primaryColor}
            compact={compact}
            coordinate={coordinate}
            label={player?.shirtNumber?.toString() ?? coordinate.label}
          />
        );
      })}
    </div>
  );
}

function PlayerNumber({
  color,
  compact,
  coordinate,
  label,
}: {
  color: string;
  compact: boolean;
  coordinate: FormationCoordinate;
  label: string;
}) {
  return (
    <div
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 font-black text-white shadow-lg shadow-black/40 ${
        compact ? "h-6 w-6 text-[0.52rem]" : "h-8 w-8 text-[0.62rem]"
      }`}
      style={{
        left: `${coordinate.x}%`,
        top: `${coordinate.y}%`,
        backgroundColor: color,
      }}
      title={label}
    >
      {label}
    </div>
  );
}

function PlayerSheetList({
  team,
  layout,
}: {
  team: TeamLineup;
  layout: "feed" | "story";
}) {
  const isStory = layout === "story";
  const displayedSubstitutes = team.substitutes;

  return (
    <div className={`grid h-full min-h-0 ${isStory ? "grid-rows-[1fr_auto]" : "grid-cols-[1.12fr_0.88fr] gap-2"}`}>
      <RosterColumn
        title="Starting XI"
        players={team.starters}
        teamColor={team.primaryColor}
        variant={isStory ? "story-starter" : "feed-starter"}
      />
      <RosterColumn
        title="Cadangan"
        players={displayedSubstitutes}
        teamColor={team.primaryColor}
        variant={isStory ? "story-bench" : "feed-bench"}
      />
    </div>
  );
}

function RosterColumn({
  title,
  players,
  teamColor,
  variant,
}: {
  title: string;
  players: TeamLineup["starters"];
  teamColor: string;
  variant: "story-starter" | "story-bench" | "feed-starter" | "feed-bench";
}) {
  const isStory = variant.startsWith("story");
  const isBench = variant.endsWith("bench");
  const rowClass = isStory
    ? "grid min-w-0 grid-cols-[1.1rem_1rem_1fr] items-center gap-1 border-b border-white/5 py-[1px] last:border-b-0"
    : "grid min-w-0 grid-cols-[1.25rem_1rem_1fr] items-center gap-1 border-b border-white/5 py-[2px] last:border-b-0";
  const numberClass = isStory
    ? "grid h-3.5 w-3.5 place-items-center rounded-full text-[0.34rem] font-black text-white"
    : "grid h-4 w-4 place-items-center rounded-full text-[0.4rem] font-black text-white";
  const nameClass = isStory
    ? "truncate text-[0.38rem] font-black uppercase tracking-[0.01em] text-[#f3efe2]"
    : "truncate text-[0.45rem] font-black uppercase tracking-[0.01em] text-[#f3efe2]";

  return (
    <div className="min-h-0 overflow-hidden">
      <p className={isStory ? "mb-0.5 text-[0.38rem] font-black uppercase tracking-[0.16em] text-[#b7ff5a]" : "mb-1 text-[0.42rem] font-black uppercase tracking-[0.18em] text-[#b7ff5a]"}>
        {title}
      </p>
      <div className="grid min-h-0 gap-0 overflow-hidden">
        {players.map((player) => (
          <div key={player.id} className={rowClass}>
            <span
              className={numberClass}
              style={{
                backgroundColor: isBench ? "rgb(243 239 226 / 0.18)" : teamColor,
              }}
            >
              {player.shirtNumber}
            </span>
            <FlagBadge
              code={player.countryCode}
              label={player.nationality}
              flagUrl={player.countryFlagUrl}
              tiny
            />
            <span className={nameClass}>{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineupFooter({
  lineupData,
  compact = false,
}: {
  lineupData: MatchdayLineupData;
  compact?: boolean;
}) {
  return (
    <footer className={compact ? "relative mt-2 flex items-center justify-between gap-2 text-[0.48rem] uppercase tracking-[0.16em] text-[#9d9a90]" : "relative mt-3 flex items-center justify-between gap-3 text-[0.58rem] uppercase tracking-[0.2em] text-[#9d9a90]"}>
      <div className="h-px flex-1 bg-[#f3efe2]/10" />
      <p className={compact ? "rounded-md border border-[#f3efe2]/10 bg-[#f3efe2]/[0.06] px-3 py-1.5 font-black text-[#f3efe2]" : "rounded-md border border-[#f3efe2]/10 bg-[#f3efe2]/[0.06] px-4 py-2 font-black text-[#f3efe2]"}>
        GOSBALL
      </p>
      <div className="h-px flex-1 bg-[#f3efe2]/10" />
      {lineupData.sponsor.enabled ? (
        <p className={compact ? "absolute inset-x-0 -bottom-3 text-center text-[0.42rem]" : "absolute inset-x-0 -bottom-4 text-center text-[0.5rem]"}>
          Presented by{" "}
          <span className="font-black text-[#b7ff5a]">
            {lineupData.sponsor.brandName}
          </span>
        </p>
      ) : null}
    </footer>
  );
}

function TeamLogo({
  team,
  compact = false,
}: {
  team: TeamLineup;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-[0.7rem] border border-white/20 font-black uppercase text-white shadow-lg shadow-black/30 ${
        compact ? "h-8 w-8 text-[0.5rem]" : "h-10 w-10 text-[0.62rem]"
      }`}
      style={{ backgroundColor: team.primaryColor }}
    >
      {team.shortName.slice(0, 3)}
    </div>
  );
}

function mirrorCoordinate(
  coordinate: FormationCoordinate,
): FormationCoordinate {
  return {
    ...coordinate,
    y: 100 - coordinate.y,
  };
}

function RumorPoster({
  aspectRatio,
  rumorData,
}: {
  aspectRatio: CanvasAspectRatio;
  rumorData: TransferRumorData;
}) {
  const isStory = aspectRatio === "9:16";

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col justify-between ${
        isStory ? "p-[7%]" : "p-[5.8%]"
      }`}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="rounded-md border border-[#b7ff5a]/20 bg-[#b7ff5a]/10 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.24em] text-[#b7ff5a]">
          Transfer Radar
        </div>
        <RumorBadge status={rumorData.status} />
      </header>

      <section className="my-auto">
        <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[#f3efe2]/10 bg-[#f3efe2]/10 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#c8c2b2] backdrop-blur">
          <Sparkles className="h-4 w-4 text-[#b7ff5a]" />
          League Watch
        </div>
        <h2
          className={`display-type max-w-full font-black uppercase leading-[0.9] tracking-[-0.08em] [overflow-wrap:anywhere] ${
            isStory
              ? "text-[clamp(2.35rem,12vw,4.85rem)]"
              : "text-[clamp(3.2rem,8vw,6rem)]"
          }`}
        >
          {rumorData.player?.name ?? "Unknown Player"}
        </h2>
        <div className="glass-edge mt-6 grid gap-3 rounded-[1.5rem] p-4">
          <div className="flex items-center justify-between gap-3 text-sm font-black uppercase tracking-[-0.02em]">
            <span className="truncate">{rumorData.fromClub}</span>
            <ArrowRight className="h-5 w-5 shrink-0 text-[#b7ff5a]" />
            <span className="truncate text-right text-[#b7ff5a]">
              {rumorData.toClub}
            </span>
          </div>
          <div>
            <div className="mb-2 flex items-end justify-between">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.28em] text-[#9d9a90]">
                Rumor Meter
              </p>
              <p className="text-4xl font-black tracking-[-0.08em] text-[#f3efe2]">
                {rumorData.percentage}%
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#b7ff5a]"
                style={{ width: `${rumorData.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between gap-4 border-t border-[#f3efe2]/10 pt-5 text-[0.62rem] uppercase tracking-[0.2em] text-[#9d9a90]">
        <div className="flex items-center gap-2">
          <Goal className="h-4 w-4 text-[#b7ff5a]" />
          <span>GOSBALL</span>
        </div>
        {rumorData.sponsor.enabled ? (
          <p className="text-right">
            Presented by{" "}
              <span className="font-black text-[#b7ff5a]">
              {rumorData.sponsor.brandName}
            </span>
          </p>
        ) : null}
      </footer>
    </div>
  );
}

function RumorBadge({ status }: { status: TransferRumorData["status"] }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[#f3efe2]/10 bg-[#f3efe2]/10 px-4 py-2 text-[0.58rem] font-black uppercase tracking-[0.18em] backdrop-blur">
      <BadgeCheck className="h-4 w-4 text-[#b7ff5a]" />
      {status}
    </div>
  );
}
