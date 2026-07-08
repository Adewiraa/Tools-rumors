"use client";

import { forwardRef } from "react";
import { ArrowRight, BadgeCheck, ScanLine } from "lucide-react";
import { FlagBadge } from "@/components/gosball/flag-badge";
import { formationTemplates } from "@/lib/gosball-fixtures";
import { getRumorCategory } from "@/lib/rumor-categories";
import type {
  CanvasAspectRatio,
  FormationCoordinate,
  MatchdayLineupData,
  Player,
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

const stripe = {
  navy: "#061B31",
  slate: "#273951",
  muted: "#64748D",
  line: "#D4DEE9",
  soft: "#E5EDF5",
  purple: "#533AFD",
  orange: "#FF6118",
  lavender: "#E8E9FF",
};

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
          className={`gosball-canvas relative overflow-hidden rounded-[5px] border bg-white text-[#061B31] shadow-[0_24px_70px_rgba(6,27,49,0.14)] ${canvasSizeClass}`}
          style={{ borderColor: stripe.line }}
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
      <div className="absolute inset-0 bg-[#F6F9FC]" />
      <div className="absolute -right-[18%] -top-[24%] h-[48%] w-[58%] rotate-[-12deg] rounded-[32px] bg-[linear-gradient(135deg,rgba(83,58,253,0.20),rgba(255,97,24,0.13))]" />
      <div className="absolute -left-[20%] bottom-[10%] h-[38%] w-[58%] rotate-[-12deg] rounded-[28px] bg-[rgba(83,58,253,0.08)]" />
      <div className="absolute inset-0 opacity-[0.42] [background-image:linear-gradient(rgba(6,27,49,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,27,49,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />
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
  const isStory = aspectRatio === "9:16";

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col ${
        isStory ? "p-[5.6%]" : "p-[4.7%]"
      }`}
    >
      <LineupHeader lineupData={lineupData} compact={isStory} />

      <div
        className={
          isStory
            ? "mt-3 grid min-h-0 flex-1 grid-rows-2 gap-2.5"
            : "mt-5 grid min-h-0 flex-1 grid-cols-2 gap-3"
        }
      >
        <TeamCard
          team={lineupData.homeTeam}
          side="home"
          variant={isStory ? "story" : "feed"}
        />
        <TeamCard
          team={lineupData.awayTeam}
          side="away"
          variant={isStory ? "story" : "feed"}
        />
      </div>

      <LineupFooter lineupData={lineupData} compact={isStory} />
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
    <header className="grid grid-cols-[1fr_auto] items-start gap-3">
      <div className="min-w-0">
        <p className="studio-label text-[#533AFD]">Gosball match sheet</p>
        <h2
          className={`display-type mt-1 leading-[0.95] tracking-[-0.055em] text-[#061B31] [overflow-wrap:anywhere] ${
            compact
              ? "text-[clamp(2.2rem,11vw,3.3rem)]"
              : "text-[clamp(3.1rem,6.4vw,5.4rem)]"
          }`}
        >
          {lineupData.homeTeam.shortName}
          <span className="mx-2 text-[#533AFD]">/</span>
          <wbr />
          {lineupData.awayTeam.shortName}
        </h2>
        <div
          className={`mt-2 flex flex-wrap items-center gap-2 text-[#64748D] ${
            compact ? "text-[0.58rem]" : "text-[0.72rem]"
          }`}
        >
          <span>{lineupData.competitionName}</span>
          <span className="h-1 w-1 rounded-full bg-[#FF6118]" />
          <span>{lineupData.matchLabel}</span>
          {lineupData.venue ? (
            <>
              <span className="h-1 w-1 rounded-full bg-[#FF6118]" />
              <span>{lineupData.venue}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-[5px] border border-[#D4DEE9] bg-white/88 px-3 py-2 text-right">
        <ScanLine className="ml-auto h-4 w-4 text-[#533AFD]" />
        <p className="mt-1 text-[0.55rem] text-[#64748D]">XI</p>
        <p className={compact ? "text-xl leading-none" : "text-2xl leading-none"}>
          22
        </p>
      </div>
    </header>
  );
}

function TeamCard({
  team,
  side,
  variant,
}: {
  team: TeamLineup;
  side: "home" | "away";
  variant: "feed" | "story";
}) {
  const isStory = variant === "story";

  return (
    <section className="relative min-h-0 overflow-hidden rounded-[6px] border border-[#D4DEE9] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${team.primaryColor}, ${stripe.purple})`,
        }}
      />
      <div className={`flex h-full min-h-0 flex-col ${isStory ? "p-3" : "p-4"}`}>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <TeamLogo team={team} compact={isStory} />
          <div className="min-w-0">
            <h3
              className={`truncate text-[#061B31] ${
                isStory ? "text-[0.82rem]" : "text-[1rem]"
              }`}
            >
              {team.name}
            </h3>
            <p
              className={`truncate text-[#64748D] ${
                isStory ? "text-[0.54rem]" : "text-[0.66rem]"
              }`}
            >
              {team.formation} / coach {team.coach.name}
            </p>
          </div>
          <span className="rounded-[4px] border border-[#D4DEE9] bg-[#F6F9FC] px-2 py-1 text-[0.56rem] text-[#64748D]">
            {side === "home" ? "Home" : "Away"}
          </span>
        </div>

        <div
          className={
            isStory
              ? "mt-2 grid min-h-0 flex-1 grid-cols-[36%_1fr] gap-2"
              : "mt-3 grid min-h-0 flex-1 grid-rows-[36%_1fr] gap-3"
          }
        >
          <TacticalPitch team={team} side={side} compact={isStory} />
          <RosterGrid team={team} variant={variant} />
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
    <div className="relative min-h-0 overflow-hidden rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC]">
      <div className="absolute inset-2 rounded-[5px] border border-[#D4DEE9]" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-[#D4DEE9]" />
      <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D4DEE9]" />
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
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 text-white shadow-[0_6px_16px_rgba(6,27,49,0.16)] ${
        compact ? "h-5 w-5 text-[0.48rem]" : "h-7 w-7 text-[0.58rem]"
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

function RosterGrid({
  team,
  variant,
}: {
  team: TeamLineup;
  variant: "feed" | "story";
}) {
  return (
    <div className="grid min-h-0 grid-cols-2 gap-2 overflow-hidden">
      <RosterColumn
        title="Starting XI"
        players={team.starters}
        teamColor={team.primaryColor}
        variant={variant}
      />
      <RosterColumn
        title="Cadangan"
        players={team.substitutes.slice(0, 10)}
        teamColor={team.primaryColor}
        variant={variant}
        bench
      />
    </div>
  );
}

function RosterColumn({
  title,
  players,
  teamColor,
  variant,
  bench = false,
}: {
  title: string;
  players: Player[];
  teamColor: string;
  variant: "feed" | "story";
  bench?: boolean;
}) {
  const isStory = variant === "story";
  const rowClass = isStory
    ? "grid min-w-0 grid-cols-[1rem_0.92rem_1fr] items-center gap-1 border-b border-[#E5EDF5] py-[1px] last:border-b-0"
    : "grid min-w-0 grid-cols-[1.1rem_1rem_1fr] items-center gap-1 border-b border-[#E5EDF5] py-[2px] last:border-b-0";

  return (
    <div className="min-h-0 overflow-hidden">
      <p
        className={`mb-1 text-[#533AFD] ${
          isStory ? "text-[0.46rem]" : "text-[0.55rem]"
        }`}
      >
        {title}
      </p>
      <div className="grid min-h-0 gap-0 overflow-hidden">
        {players.map((player) => (
          <div key={player.id} className={rowClass}>
            <span
              className={`grid place-items-center rounded-full text-white ${
                isStory ? "h-3.5 w-3.5 text-[0.34rem]" : "h-4 w-4 text-[0.4rem]"
              }`}
              style={{
                backgroundColor: bench ? stripe.muted : teamColor,
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
            <span
              className={`min-w-0 truncate text-[#273951] ${
                isStory ? "text-[0.39rem]" : "text-[0.48rem]"
              }`}
            >
              {player.name}
            </span>
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
    <footer
      className={`relative mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[#64748D] ${
        compact ? "text-[0.5rem]" : "text-[0.62rem]"
      }`}
    >
      <div className="h-px bg-[#D4DEE9]" />
      <p className="rounded-[4px] border border-[#D4DEE9] bg-white px-4 py-1.5 text-[#061B31]">
        Gosball
      </p>
      <div className="h-px bg-[#D4DEE9]" />
      {lineupData.sponsor.enabled ? (
        <p className="absolute inset-x-0 -bottom-3 text-center">
          Presented by{" "}
          <span className="text-[#533AFD]">{lineupData.sponsor.brandName}</span>
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
  const initials = team.shortName.slice(0, 3);

  if (team.logoUrl) {
    return (
      <div
        className={`grid shrink-0 place-items-center overflow-hidden rounded-[5px] border border-[#D4DEE9] bg-white ${
          compact ? "h-8 w-8" : "h-10 w-10"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={team.logoUrl} alt={team.name} className="h-full w-full object-contain p-1" />
      </div>
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-[5px] text-white ${
        compact ? "h-8 w-8 text-[0.54rem]" : "h-10 w-10 text-[0.65rem]"
      }`}
      style={{ backgroundColor: team.primaryColor }}
    >
      {initials}
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
  const category = getRumorCategory(rumorData.percentage);

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col ${
        isStory ? "p-[7%]" : "p-[5.4%]"
      }`}
    >
      <header className="flex items-center justify-between gap-3">
        <p className="studio-label text-[#533AFD]">Gosball transfer desk</p>
        <RumorBadge label={category.label} />
      </header>

      <section className="my-auto grid gap-4">
        <div className="rounded-[6px] border border-[#D4DEE9] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="text-[0.72rem] text-[#64748D]">
            {rumorData.status} / {category.range}
          </p>
          <h2
            className={`display-type mt-2 leading-[0.98] tracking-[-0.055em] text-[#061B31] [overflow-wrap:anywhere] ${
              isStory
                ? "text-[clamp(3rem,15vw,5.8rem)]"
                : "text-[clamp(4rem,9vw,7rem)]"
            }`}
          >
            {rumorData.player?.name ?? "Unknown Player"}
          </h2>
        </div>

        <div className="grid gap-3 rounded-[6px] border border-[#D4DEE9] bg-[#F6F9FC] p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[#273951]">
            <span className="truncate">{rumorData.fromClub}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E8E9FF] text-[#533AFD]">
              <ArrowRight className="h-4 w-4" />
            </span>
            <span className="truncate text-right text-[#061B31]">
              {rumorData.toClub}
            </span>
          </div>

          <div className="grid grid-cols-[auto_1fr] items-end gap-4">
            <div>
              <p className="text-[0.68rem] text-[#64748D]">Rumor meter</p>
              <p className="text-5xl tracking-[-0.08em] text-[#061B31]">
                {rumorData.percentage}%
              </p>
            </div>
            <div className="pb-2">
              <div className="h-2 overflow-hidden rounded-full bg-[#D4DEE9]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#533AFD,#FF6118)]"
                  style={{ width: `${rumorData.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-right text-[0.68rem] text-[#64748D]">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between gap-4 border-t border-[#D4DEE9] pt-4 text-[0.68rem] text-[#64748D]">
        <span className="text-[#061B31]">Gosball</span>
        {rumorData.sponsor.enabled ? (
          <p className="text-right">
            Presented by{" "}
            <span className="text-[#533AFD]">{rumorData.sponsor.brandName}</span>
          </p>
        ) : null}
      </footer>
    </div>
  );
}

function RumorBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[4px] border border-[#D4DEE9] bg-white px-3 py-2 text-[0.66rem] text-[#273951]">
      <BadgeCheck className="h-4 w-4 text-[#533AFD]" />
      {label}
    </div>
  );
}
