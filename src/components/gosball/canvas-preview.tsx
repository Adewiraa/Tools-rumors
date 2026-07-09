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
  slate: "#1A2C44",
  muted: "#A7B2C5",
  line: "rgba(229,237,245,0.16)",
  soft: "#0D1738",
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
          className={`gosball-canvas relative overflow-hidden rounded-[5px] border bg-[#05070A] text-white shadow-[0_24px_70px_rgba(0,0,0,0.32)] ${canvasSizeClass}`}
          style={{ borderColor: stripe.line }}
        >
          <CanvasBackground />
          {mode === "lineup" ? (
            <LineupPoster aspectRatio={aspectRatio} lineupData={lineupData} />
          ) : mode === "rumor" ? (
            <RumorPoster aspectRatio={aspectRatio} rumorData={rumorData} />
          ) : (
            <MasterPreview />
          )}
        </div>
      </div>
    );
  },
);

function CanvasBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[#05070A]" />
      <div className="absolute -right-[18%] -top-[24%] h-[48%] w-[58%] rotate-[-12deg] rounded-[32px] bg-[linear-gradient(135deg,rgba(83,58,253,0.32),rgba(255,97,24,0.18))]" />
      <div className="absolute -left-[20%] bottom-[10%] h-[38%] w-[58%] rotate-[-12deg] rounded-[28px] bg-[rgba(83,58,253,0.12)]" />
      <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(229,237,245,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(229,237,245,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_24rem)]" />
    </>
  );
}

function MasterPreview() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-[7%]">
      <section className="max-w-md rounded-[6px] border border-white/15 bg-[#0B1020]/92 p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.28)]">
        <p className="studio-label text-[#A78BFA]">Gosball database</p>
        <h2 className="display-type mt-3 text-5xl leading-none tracking-[-0.05em] text-white">
          Master Data
        </h2>
        <p className="mt-4 text-sm leading-6 text-[#A7B2C5]">
          Tambahkan klub, logo, warna, dan pemain per klub. Data pemain asing
          akan membawa negara otomatis ke lineup.
        </p>
      </section>
    </div>
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

  if (!isStory) {
    return <LineupFeedPoster lineupData={lineupData} />;
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col p-[5.6%]">
      <LineupHeader lineupData={lineupData} compact />

      <FaceoffPitch lineupData={lineupData} story />

      <div className="mt-2 grid min-h-0 flex-1 grid-rows-2 gap-2">
        <StoryRosterBoard team={lineupData.homeTeam} side="home" />
        <StoryRosterBoard team={lineupData.awayTeam} side="away" />
      </div>

      <LineupFooter lineupData={lineupData} compact />
    </div>
  );
}

function LineupFeedPoster({ lineupData }: { lineupData: MatchdayLineupData }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col p-[4.7%]">
      <LineupHeader lineupData={lineupData} compact={false} />

      <FaceoffPitch lineupData={lineupData} />

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3">
        <FeedRosterBoard team={lineupData.homeTeam} side="home" />
        <FeedRosterBoard team={lineupData.awayTeam} side="away" />
      </div>

      <LineupFooter lineupData={lineupData} />
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
        <p className="studio-label text-[#A78BFA]">Gosball match sheet</p>
        <h2
          className={`display-type mt-1 leading-[0.95] tracking-[-0.055em] text-white [overflow-wrap:anywhere] ${
            compact
              ? "text-[clamp(2.2rem,11vw,3.3rem)]"
              : "text-[clamp(3.1rem,6.4vw,5.4rem)]"
          }`}
        >
          {lineupData.homeTeam.shortName}
          <span className="mx-2 text-[#FF6118]">/</span>
          <wbr />
          {lineupData.awayTeam.shortName}
        </h2>
        <div
          className={`mt-2 flex flex-wrap items-center gap-2 text-[#A7B2C5] ${
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

      <div className="rounded-[5px] border border-white/15 bg-white/[0.06] px-3 py-2 text-right">
        <ScanLine className="ml-auto h-4 w-4 text-[#A78BFA]" />
        <p className="mt-1 text-[0.55rem] text-[#A7B2C5]">XI</p>
        <p className={compact ? "text-xl leading-none" : "text-2xl leading-none"}>
          22
        </p>
      </div>
    </header>
  );
}

function FaceoffPitch({
  lineupData,
  story = false,
}: {
  lineupData: MatchdayLineupData;
  story?: boolean;
}) {
  return (
    <section
      className={`relative mt-4 overflow-hidden rounded-[6px] border border-white/15 bg-[#061B31]/72 ${
        story ? "h-[32%] min-h-[210px]" : "h-[28%] min-h-[180px]"
      }`}
    >
      <div className={story ? "absolute inset-2 rounded-[5px] border border-white/12" : "absolute inset-3 rounded-[5px] border border-white/12"} />
      <div className={story ? "absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px bg-white/12" : "absolute left-1/2 top-3 h-[calc(100%-1.5rem)] w-px bg-white/12"} />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 ${
          story ? "h-16 w-16" : "h-20 w-20"
        }`}
      />
      <div className={story ? "absolute left-2 top-1/2 h-20 w-10 -translate-y-1/2 rounded-r-full border border-l-0 border-white/10" : "absolute left-3 top-1/2 h-24 w-12 -translate-y-1/2 rounded-r-full border border-l-0 border-white/10"} />
      <div className={story ? "absolute right-2 top-1/2 h-20 w-10 -translate-y-1/2 rounded-l-full border border-r-0 border-white/10" : "absolute right-3 top-1/2 h-24 w-12 -translate-y-1/2 rounded-l-full border border-r-0 border-white/10"} />

      <PitchTeamLabel team={lineupData.homeTeam} side="left" />
      <PitchTeamLabel team={lineupData.awayTeam} side="right" />

      {lineupData.homeTeam.starters.map((player, index) => {
        const coordinate = formationTemplates[lineupData.homeTeam.formation].coordinates[index];
        const faceoffCoordinate = toFaceoffCoordinate(coordinate, "home");

        return (
          <PlayerNumber
            key={`faceoff-home-${player.id}`}
            color={lineupData.homeTeam.primaryColor}
            compact
            coordinate={story ? squeezeFaceoffCoordinate(faceoffCoordinate) : faceoffCoordinate}
            label={player.shirtNumber?.toString() ?? coordinate.label}
          />
        );
      })}

      {lineupData.awayTeam.starters.map((player, index) => {
        const coordinate = formationTemplates[lineupData.awayTeam.formation].coordinates[index];
        const faceoffCoordinate = toFaceoffCoordinate(coordinate, "away");

        return (
          <PlayerNumber
            key={`faceoff-away-${player.id}`}
            color={lineupData.awayTeam.primaryColor}
            compact
            coordinate={story ? squeezeFaceoffCoordinate(faceoffCoordinate) : faceoffCoordinate}
            label={player.shirtNumber?.toString() ?? coordinate.label}
          />
        );
      })}
    </section>
  );
}

function PitchTeamLabel({
  team,
  side,
}: {
  team: TeamLineup;
  side: "left" | "right";
}) {
  return (
    <div
      className={`absolute top-3 flex items-center gap-2 rounded-[4px] border border-white/15 bg-[#05070A]/70 px-2 py-1 text-[0.58rem] text-[#E5EDF5] ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: team.primaryColor }}
      />
      {team.shortName} · {team.formation}
    </div>
  );
}

function FeedRosterBoard({
  team,
  side,
}: {
  team: TeamLineup;
  side: "home" | "away";
}) {
  return (
    <section className="relative min-h-0 overflow-hidden rounded-[6px] border border-white/15 bg-[#0B1020]/92 shadow-[0_1px_2px_rgba(0,0,0,0.28)]">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${team.primaryColor}, ${stripe.purple})`,
        }}
      />
      <div className="flex h-full min-h-0 flex-col p-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <TeamLogo team={team} />
          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] text-white">{team.name}</h3>
            <p className="truncate text-[0.6rem] text-[#A7B2C5]">
              coach {team.coach.name}
            </p>
          </div>
          <span className="rounded-[4px] border border-white/15 bg-white/[0.05] px-2 py-1 text-[0.54rem] text-[#A7B2C5]">
            {side === "home" ? "Home" : "Away"}
          </span>
        </div>
        <div className="mt-2 min-h-0 flex-1">
          <RosterGrid team={team} variant="feed" />
        </div>
      </div>
    </section>
  );
}

function StoryRosterBoard({
  team,
  side,
}: {
  team: TeamLineup;
  side: "home" | "away";
}) {
  return (
    <section className="relative min-h-0 overflow-hidden rounded-[6px] border border-white/15 bg-[#0B1020]/92">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${team.primaryColor}, ${stripe.purple})`,
        }}
      />
      <div className="flex h-full min-h-0 flex-col p-2.5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <TeamLogo team={team} compact />
          <div className="min-w-0">
            <h3 className="truncate text-[0.82rem] text-white">{team.name}</h3>
            <p className="truncate text-[0.52rem] text-[#A7B2C5]">
              {team.formation} / coach {team.coach.name}
            </p>
          </div>
          <span className="rounded-[4px] border border-white/15 bg-white/[0.05] px-2 py-1 text-[0.48rem] text-[#A7B2C5]">
            {side === "home" ? "Home" : "Away"}
          </span>
        </div>
        <div className="mt-1.5 min-h-0 flex-1">
          <RosterGrid team={team} variant="story" />
        </div>
      </div>
    </section>
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
    <section className="relative min-h-0 overflow-hidden rounded-[6px] border border-white/15 bg-[#0B1020]/92 shadow-[0_1px_2px_rgba(0,0,0,0.28)]">
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
              className={`truncate text-white ${
                isStory ? "text-[0.82rem]" : "text-[1rem]"
              }`}
            >
              {team.name}
            </h3>
            <p
              className={`truncate text-[#A7B2C5] ${
                isStory ? "text-[0.54rem]" : "text-[0.66rem]"
              }`}
            >
              {team.formation} / coach {team.coach.name}
            </p>
          </div>
          <span className="rounded-[4px] border border-white/15 bg-white/[0.05] px-2 py-1 text-[0.56rem] text-[#A7B2C5]">
            {side === "home" ? "Home" : "Away"}
          </span>
        </div>

        <div
          className={
            isStory
              ? "mt-2 grid min-h-0 flex-1 grid-cols-[39%_1fr] gap-2"
              : "mt-3 grid min-h-0 flex-1 grid-cols-[38%_1fr] gap-3"
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
    <div className="relative h-full min-h-0 overflow-hidden rounded-[5px] border border-white/15 bg-[#061B31]/72">
      <div className="absolute inset-2 rounded-[5px] border border-white/12" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/12" />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 ${
          compact ? "h-10 w-10" : "h-16 w-16"
        }`}
      />
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
    ? "grid min-w-0 grid-cols-[0.72rem_1fr] items-center gap-1 border-b border-white/10 py-[1px] last:border-b-0"
    : "grid min-w-0 grid-cols-[0.86rem_1fr] items-center gap-1.5 border-b border-white/10 py-[2px] last:border-b-0";

  return (
    <div className="min-h-0 overflow-hidden">
      <p
        className={`mb-1 text-[#A78BFA] ${
          isStory ? "text-[0.46rem]" : "text-[0.55rem]"
        }`}
      >
        {title}
      </p>
      <div className="grid min-h-0 gap-0 overflow-hidden">
        {players.map((player) => {
          const isForeignPlayer =
            (player.countryCode ?? "ID").toUpperCase() !== "ID";

          return (
            <div key={player.id} className={rowClass}>
              <span
                className={`tabular-nums text-[#A7B2C5] ${
                  isStory
                    ? "text-[0.36rem]"
                    : "text-[0.44rem]"
                }`}
              >
                {player.shirtNumber}
              </span>
              <span className="flex min-w-0 items-center gap-1">
                {isForeignPlayer ? (
                  <FlagBadge
                    code={player.countryCode}
                    label={player.nationality}
                    flagUrl={player.countryFlagUrl}
                    tiny
                  />
                ) : null}
                <span
                  className={`roster-name min-w-0 truncate text-white ${
                    isStory ? "text-[0.43rem]" : "text-[0.54rem]"
                  }`}
                >
                  {player.name}
                </span>
              </span>
            </div>
          );
        })}
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
      className={`relative mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[#A7B2C5] ${
        compact ? "text-[0.5rem]" : "text-[0.62rem]"
      }`}
    >
      <div className="h-px bg-white/15" />
      <p className="rounded-[4px] border border-white/15 bg-white/[0.06] px-4 py-1.5 text-white">
        Gosball
      </p>
      <div className="h-px bg-white/15" />
      {lineupData.sponsor.enabled ? (
        <p className="absolute inset-x-0 -bottom-3 text-center">
          Presented by{" "}
          <span className="text-[#A78BFA]">{lineupData.sponsor.brandName}</span>
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
        className={`grid shrink-0 place-items-center overflow-hidden rounded-[5px] border border-white/15 bg-white ${
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

function toFaceoffCoordinate(
  coordinate: FormationCoordinate,
  side: "home" | "away",
): FormationCoordinate {
  const depth = 100 - coordinate.y;
  const left = side === "home" ? 7 + depth * 0.43 : 93 - depth * 0.43;
  const top = 12 + coordinate.x * 0.76;

  return {
    ...coordinate,
    x: left,
    y: top,
  };
}

function squeezeFaceoffCoordinate(
  coordinate: FormationCoordinate,
): FormationCoordinate {
  return {
    ...coordinate,
    x: 10 + coordinate.x * 0.8,
    y: 10 + coordinate.y * 0.8,
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
        <p className="studio-label text-[#A78BFA]">Gosball transfer desk</p>
        <RumorBadge label={category.label} />
      </header>

      <section className="my-auto grid gap-4">
        <div className="rounded-[6px] border border-white/15 bg-[#0B1020]/92 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.28)]">
          <p className="text-[0.72rem] text-[#A7B2C5]">
            {rumorData.status} / {category.range}
          </p>
          <h2
            className={`display-type mt-2 leading-[0.98] tracking-[-0.055em] text-white [overflow-wrap:anywhere] ${
              isStory
                ? "text-[clamp(3rem,15vw,5.8rem)]"
                : "text-[clamp(4rem,9vw,7rem)]"
            }`}
          >
            {rumorData.player?.name ?? "Unknown Player"}
          </h2>
        </div>

        <div className="grid gap-3 rounded-[6px] border border-white/15 bg-[#061B31]/72 p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[#E5EDF5]">
            <span className="truncate">{rumorData.fromClub}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-[#A78BFA]">
              <ArrowRight className="h-4 w-4" />
            </span>
            <span className="truncate text-right text-white">
              {rumorData.toClub}
            </span>
          </div>

          <div className="grid grid-cols-[auto_1fr] items-end gap-4">
            <div>
              <p className="text-[0.68rem] text-[#A7B2C5]">Rumor meter</p>
              <p className="text-5xl tracking-[-0.08em] text-white">
                {rumorData.percentage}%
              </p>
            </div>
            <div className="pb-2">
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#533AFD,#FF6118)]"
                  style={{ width: `${rumorData.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-right text-[0.68rem] text-[#A7B2C5]">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between gap-4 border-t border-white/15 pt-4 text-[0.68rem] text-[#A7B2C5]">
        <span className="text-white">Gosball</span>
        {rumorData.sponsor.enabled ? (
          <p className="text-right">
            Presented by{" "}
            <span className="text-[#A78BFA]">{rumorData.sponsor.brandName}</span>
          </p>
        ) : null}
      </footer>
    </div>
  );
}

function RumorBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[4px] border border-white/15 bg-white/[0.06] px-3 py-2 text-[0.66rem] text-[#E5EDF5]">
      <BadgeCheck className="h-4 w-4 text-[#A78BFA]" />
      {label}
    </div>
  );
}
