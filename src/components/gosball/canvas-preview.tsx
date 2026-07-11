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
  MatchResultData,
  Player,
  TeamLineup,
  ToolMode,
  TransferRumorData,
} from "@/types/gosball";

interface CanvasPreviewProps {
  mode: ToolMode;
  aspectRatio: CanvasAspectRatio;
  lineupData: MatchdayLineupData;
  matchResultData: MatchResultData;
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

const normalizeHexColor = (color: string | undefined, fallback = stripe.purple) => {
  const normalizedColor = color?.trim();

  if (!normalizedColor) {
    return fallback;
  }

  if (/^#[0-9a-f]{3}$/i.test(normalizedColor)) {
    return `#${normalizedColor
      .slice(1)
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(normalizedColor)) {
    return normalizedColor;
  }

  return fallback;
};

const hexToRgb = (color: string) => {
  const normalizedColor = normalizeHexColor(color).slice(1);
  const value = Number.parseInt(normalizedColor, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const colorAlpha = (color: string | undefined, alpha: number) => {
  const { r, g, b } = hexToRgb(normalizeHexColor(color));

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const CanvasPreview = forwardRef<HTMLDivElement, CanvasPreviewProps>(
  function CanvasPreview(
    { mode, aspectRatio, lineupData, matchResultData, rumorData },
    ref,
  ) {
    const canvasSizeClass =
      aspectRatio === "4:5"
        ? "aspect-[4/5] w-full max-w-[min(520px,calc(100svw-1rem))] lg:max-h-[calc(100dvh-4rem)]"
        : "aspect-[9/16] w-full max-w-[min(430px,calc(100svw-1rem))] lg:max-h-[calc(100dvh-4rem)]";

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
          ) : mode === "matchResult" ? (
            <MatchResultPoster matchResultData={matchResultData} />
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
    <div className="absolute inset-0 z-10 flex flex-col p-[3.8%]">
      <LineupHeader lineupData={lineupData} compact />

      <FaceoffPitch lineupData={lineupData} story />

      <div className="mt-1.5 grid min-h-0 flex-1 grid-rows-2 gap-1.5">
        <StoryRosterBoard team={lineupData.homeTeam} side="home" />
        <StoryRosterBoard team={lineupData.awayTeam} side="away" />
      </div>

      <LineupFooter lineupData={lineupData} compact />
    </div>
  );
}

function LineupFeedPoster({ lineupData }: { lineupData: MatchdayLineupData }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col p-[3.8%] sm:p-[4.7%]">
      <LineupHeader lineupData={lineupData} compact={false} />

      <FaceoffPitch lineupData={lineupData} />

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
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
        <p className={`studio-label text-[#A78BFA] ${compact ? "text-[0.52rem]" : ""}`}>
          Gosball match sheet
        </p>
        <div
          className={`mt-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center ${
            compact ? "gap-1.5" : "gap-3"
          }`}
        >
          <TeamLogo team={lineupData.homeTeam} header compact={compact} />
          <h2
            className={`display-type min-w-0 text-center leading-[0.95] tracking-[-0.055em] text-white [overflow-wrap:anywhere] ${
              compact
                ? "text-[clamp(1.45rem,7.5vw,2.05rem)]"
                : "text-[clamp(1.9rem,5.6vw,4.8rem)]"
            }`}
          >
            {lineupData.homeTeam.shortName}
            <span className="mx-2 text-[#FF6118]">/</span>
            <wbr />
            {lineupData.awayTeam.shortName}
          </h2>
          <TeamLogo team={lineupData.awayTeam} header compact={compact} />
        </div>
        <div
          className={`flex flex-wrap items-center gap-2 text-[#A7B2C5] ${
            compact ? "mt-1 text-[0.52rem]" : "mt-2 text-[0.72rem]"
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

      <div className={compact ? "rounded-[5px] border border-white/15 bg-white/[0.06] px-2 py-1.5 text-right" : "rounded-[5px] border border-white/15 bg-white/[0.06] px-3 py-2 text-right"}>
        <ScanLine className="ml-auto h-4 w-4 text-[#A78BFA]" />
        <p className={compact ? "mt-0.5 text-[0.45rem] text-[#A7B2C5]" : "mt-1 text-[0.55rem] text-[#A7B2C5]"}>XI</p>
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
      className={`relative overflow-hidden rounded-[6px] border border-white/15 bg-[#061B31]/72 ${
        story
          ? "mt-2 h-[17%] min-h-[112px]"
          : "mt-2 h-[23%] min-h-[86px] sm:mt-4 sm:h-[28%] sm:min-h-[160px]"
      }`}
    >
      <div className={story ? "absolute inset-2 rounded-[5px] border border-white/12" : "absolute inset-3 rounded-[5px] border border-white/12"} />
      <div className={story ? "absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px bg-white/12" : "absolute left-1/2 top-3 h-[calc(100%-1.5rem)] w-px bg-white/12"} />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 ${
          story ? "h-10 w-10" : "h-20 w-20"
        }`}
      />
      <div className={story ? "absolute left-2 top-1/2 h-12 w-6 -translate-y-1/2 rounded-r-full border border-l-0 border-white/10" : "absolute left-3 top-1/2 h-24 w-12 -translate-y-1/2 rounded-r-full border border-l-0 border-white/10"} />
      <div className={story ? "absolute right-2 top-1/2 h-12 w-6 -translate-y-1/2 rounded-l-full border border-r-0 border-white/10" : "absolute right-3 top-1/2 h-24 w-12 -translate-y-1/2 rounded-l-full border border-r-0 border-white/10"} />

      {lineupData.homeTeam.starters.map((player, index) => {
        const coordinate = formationTemplates[lineupData.homeTeam.formation].coordinates[index];

        return (
          <PlayerNumber
            key={`faceoff-home-${player.id}`}
            color={lineupData.homeTeam.primaryColor}
            compact
            coordinate={toFaceoffCoordinate(coordinate, "home", story)}
            label={player.shirtNumber?.toString() ?? coordinate.label}
          />
        );
      })}

      {lineupData.awayTeam.starters.map((player, index) => {
        const coordinate = formationTemplates[lineupData.awayTeam.formation].coordinates[index];

        return (
          <PlayerNumber
            key={`faceoff-away-${player.id}`}
            color={lineupData.awayTeam.primaryColor}
            compact
            coordinate={toFaceoffCoordinate(coordinate, "away", story)}
            label={player.shirtNumber?.toString() ?? coordinate.label}
          />
        );
      })}
    </section>
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
      <div className="flex h-full min-h-0 flex-col p-2.5 sm:p-3">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[0.76rem] text-white sm:text-[0.95rem]">{team.name}</h3>
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
      <div className="flex h-full min-h-0 flex-col p-2">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[0.8rem] leading-tight text-white">{team.name}</h3>
            <p className="truncate text-[0.48rem] leading-tight text-[#A7B2C5]">
              {team.formation} / coach {team.coach.name}
            </p>
          </div>
          <span className="rounded-[4px] border border-white/15 bg-white/[0.05] px-1.5 py-0.5 text-[0.42rem] text-[#A7B2C5]">
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
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] border bg-[#05070A]/72 tabular-nums leading-none text-white ${
        compact
          ? "min-h-[0.9rem] min-w-[1.1rem] px-1 text-[0.48rem]"
          : "min-h-[1.18rem] min-w-[1.45rem] px-1.5 text-[0.62rem]"
      }`}
      style={{
        left: `${coordinate.x}%`,
        top: `${coordinate.y}%`,
        borderColor: color,
        textShadow:
          "0 1px 2px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.75)",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 12px ${color}33`,
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
    <div className={`grid min-h-0 overflow-hidden ${
      variant === "story" ? "grid-cols-[1.06fr_0.94fr] gap-2" : "grid-cols-2 gap-2"
    }`}>
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
    ? "grid min-w-0 grid-cols-[0.72rem_1fr] items-center gap-1.5 rounded-[3px] px-1.5 py-[1px] leading-none odd:bg-white/[0.035]"
    : "grid min-w-0 grid-cols-[0.82rem_1fr] items-center gap-1.5 rounded-[3px] px-1.5 py-[2px] odd:bg-white/[0.035]";

  return (
    <div className="min-h-0 overflow-hidden">
      <p
        className={`mb-1 text-[#A78BFA] ${
          isStory ? "text-[0.5rem]" : "text-[0.55rem]"
        }`}
      >
        {title}
      </p>
      <div className="grid min-h-0 gap-[1px] overflow-hidden">
        {players.map((player) => {
          const isForeignPlayer =
            (player.countryCode ?? "ID").toUpperCase() !== "ID";

          return (
            <div key={player.id} className={rowClass}>
              <span
                className={`tabular-nums text-[#8A96AC] ${
                  isStory
                    ? "text-[0.42rem]"
                    : "text-[0.43rem]"
                }`}
              >
                {player.shirtNumber}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                {isForeignPlayer ? (
                  <FlagBadge
                    code={player.countryCode}
                    label={player.nationality}
                    flagUrl={player.countryFlagUrl}
                    tiny
                  />
                ) : null}
                <span
                  className={`roster-name min-w-0 truncate text-[#F3F7FF] ${
                    isStory
                      ? "text-[0.56rem] leading-[1.16]"
                      : "text-[0.54rem] leading-[1.18]"
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
      className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[#A7B2C5] ${
        compact ? "mt-1.5 text-[0.46rem]" : "mt-3 text-[0.62rem]"
      }`}
    >
      <div className="h-px bg-white/15" />
      <p className={compact ? "rounded-[4px] border border-white/15 bg-white/[0.06] px-3 py-1 text-white" : "rounded-[4px] border border-white/15 bg-white/[0.06] px-4 py-1.5 text-white"}>
        Gosball
      </p>
      <div className="h-px bg-white/15" />
      {lineupData.sponsor.enabled ? (
        <p className={compact ? "absolute inset-x-0 -bottom-3 text-center" : "absolute inset-x-0 -bottom-4 text-center"}>
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
  micro = false,
  header = false,
}: {
  team: Pick<TeamLineup, "name" | "shortName" | "logoUrl" | "primaryColor">;
  compact?: boolean;
  micro?: boolean;
  header?: boolean;
}) {
  const initials = team.shortName.slice(0, 3);
  const shellSizeClass = header
    ? compact
      ? "h-11 w-11"
      : "h-16 w-16"
    : micro
      ? "h-8 w-8"
      : compact
        ? "h-9 w-9"
        : "h-12 w-12";
  const markSizeClass = header
    ? compact
      ? "h-8 w-8"
      : "h-12 w-12"
    : micro
      ? "h-5 w-5"
      : compact
        ? "h-6 w-6"
        : "h-8 w-8";
  const textSizeClass = header
    ? compact
      ? "text-[0.48rem]"
      : "text-[0.62rem]"
    : micro
      ? "text-[0.42rem]"
      : compact
        ? "text-[0.5rem]"
        : "text-[0.58rem]";

  if (team.logoUrl) {
    return (
      <div
        className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[7px] border border-white/15 bg-[#05070A]/82 ${shellSizeClass}`}
        style={{
          boxShadow: `inset 0 0 0 1px ${team.primaryColor}88, 0 0 18px ${team.primaryColor}66, 0 10px 22px rgba(0,0,0,0.32)`,
        }}
      >
        <span
          className="absolute inset-0 opacity-75"
          style={{
            background: `radial-gradient(circle at 50% 42%, rgba(255,255,255,0.18), transparent 42%), linear-gradient(135deg, ${team.primaryColor}CC, rgba(5,7,10,0.72) 62%)`,
          }}
        />
        <span className="absolute inset-[4px] rounded-[5px] border border-white/15 bg-black/20" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={team.logoUrl}
          alt={team.name}
          className={`relative ${markSizeClass} object-contain drop-shadow-[0_3px_7px_rgba(0,0,0,0.82)]`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[7px] border border-white/15 bg-[#05070A]/82 font-semibold text-white ${shellSizeClass} ${textSizeClass}`}
      style={{
        boxShadow: `inset 0 0 0 1px ${team.primaryColor}88, 0 0 18px ${team.primaryColor}66, 0 10px 22px rgba(0,0,0,0.32)`,
      }}
    >
      <span
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 50% 36%, rgba(255,255,255,0.16), transparent 42%), linear-gradient(135deg, ${team.primaryColor}, rgba(5,7,10,0.76) 68%)`,
        }}
      />
      <span className="absolute inset-[4px] rounded-[5px] border border-white/15 bg-black/18" />
      <span className="relative tracking-wide drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)]">
        {initials}
      </span>
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
  story = false,
): FormationCoordinate {
  const depthProgress = clamp((88 - coordinate.y) / 72, 0, 1);
  const goalLine = story ? 9 : 8;
  const kickoffLine = story ? 45 : 47;
  const horizontalDepth = goalLine + depthProgress * (kickoffLine - goalLine);
  const left = side === "home" ? horizontalDepth : 100 - horizontalDepth;
  const top = story ? 17 + coordinate.x * 0.66 : 15 + coordinate.x * 0.7;

  return {
    ...coordinate,
    x: left,
    y: top,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function MatchResultPoster({
  matchResultData,
}: {
  matchResultData: MatchResultData;
}) {
  const homeColor = normalizeHexColor(matchResultData.homeTeam.primaryColor);
  const awayColor = normalizeHexColor(matchResultData.awayTeam.primaryColor);
  const statusLabel =
    matchResultData.customStatus?.trim() || matchResultData.status;
  const homeScorers = matchResultData.scorers.filter(
    (scorer) => scorer.team === "home" && scorer.playerName.trim(),
  );
  const awayScorers = matchResultData.scorers.filter(
    (scorer) => scorer.team === "away" && scorer.playerName.trim(),
  );

  return (
    <div className="absolute inset-0 z-10 flex flex-col overflow-hidden p-[5.2%]">
      {matchResultData.backgroundImageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={matchResultData.backgroundImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(5,7,10,${
                matchResultData.overlayOpacity / 260
              }) 0%, rgba(5,7,10,0.04) 34%, rgba(5,7,10,${
                matchResultData.overlayOpacity / 120
              }) 100%)`,
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${colorAlpha(
              homeColor,
              0.78,
            )}, #0B1020 47%, ${colorAlpha(awayColor, 0.74)})`,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 16% 0%, ${colorAlpha(
            homeColor,
            0.46,
          )}, transparent 18rem), radial-gradient(circle at 88% 18%, ${colorAlpha(
            awayColor,
            0.40,
          )}, transparent 16rem), linear-gradient(90deg, ${colorAlpha(
            homeColor,
            0.14,
          )}, transparent 45%, ${colorAlpha(awayColor, 0.14)})`,
        }}
      />
      <div
        className="absolute -left-[18%] top-[14%] h-[46%] w-[72%] -skew-x-12 border-r border-white/12"
        style={{
          background: `linear-gradient(135deg, ${colorAlpha(
            homeColor,
            0.48,
          )}, ${colorAlpha(homeColor, 0.08)})`,
        }}
      />
      <div
        className="absolute -right-[18%] bottom-[12%] h-[46%] w-[72%] -skew-x-12 border-l border-white/12"
        style={{
          background: `linear-gradient(135deg, ${colorAlpha(
            awayColor,
            0.10,
          )}, ${colorAlpha(awayColor, 0.48)})`,
        }}
      />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(229,237,245,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(229,237,245,0.10)_1px,transparent_1px)] [background-size:30px_30px]" />

      <header className="relative flex items-start justify-between gap-3 border-b border-white/15 pb-3">
        <div className="min-w-0">
          <p className="studio-label" style={{ color: homeColor }}>
            Gosball match result
          </p>
          <p className="mt-1 truncate text-[0.68rem] text-[#A7B2C5]">
            {matchResultData.competitionName}
            {matchResultData.matchLabel ? ` / ${matchResultData.matchLabel}` : ""}
          </p>
        </div>
        <span
          className="rounded-[4px] border bg-[#05070A]/62 px-3 py-2 text-sm text-white shadow-[0_14px_30px_rgba(0,0,0,0.22)]"
          style={{ borderColor: colorAlpha(awayColor, 0.42) }}
        >
          {statusLabel}
        </span>
      </header>

      <section className="relative mb-4 mt-auto grid gap-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <ResultTeamBlock team={matchResultData.homeTeam} align="left" />
            <div
              className="relative grid min-w-[9.5rem] justify-items-center overflow-hidden rounded-[6px] border bg-[#05070A]/76 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.32)]"
              style={{
                borderColor: colorAlpha(homeColor, 0.32),
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{
                  background: `linear-gradient(90deg, ${homeColor}, ${awayColor})`,
                }}
              />
              <p className="studio-label mb-1 text-[0.48rem] text-[#A7B2C5]">
                Final score
              </p>
              <div className="grid grid-cols-[auto_auto_auto] items-center gap-3 text-white">
                <span className="display-type text-[5.4rem] leading-none">
                  {matchResultData.homeTeam.score}
                </span>
                <span className="text-3xl" style={{ color: awayColor }}>
                  -
                </span>
                <span className="display-type text-[5.4rem] leading-none">
                  {matchResultData.awayTeam.score}
                </span>
              </div>
              {matchResultData.status === "PEN" ? (
                <p className="mt-1 rounded-[4px] border border-white/15 bg-white/[0.08] px-3 py-1 text-[0.64rem] text-[#E5EDF5]">
                  PEN {matchResultData.homeTeam.penaltyScore ?? 0}-
                  {matchResultData.awayTeam.penaltyScore ?? 0}
                </p>
              ) : null}
            </div>
            <ResultTeamBlock team={matchResultData.awayTeam} align="right" />
          </div>
        </div>

        <div className="grid gap-2">
          <GoalList
            title={matchResultData.homeTeam.shortName}
            color={matchResultData.homeTeam.primaryColor}
            scorers={homeScorers}
            teamName={matchResultData.homeTeam.name}
          />
          <GoalList
            title={matchResultData.awayTeam.shortName}
            color={matchResultData.awayTeam.primaryColor}
            scorers={awayScorers}
            teamName={matchResultData.awayTeam.name}
            alignRight
          />
        </div>

        {matchResultData.motm || matchResultData.note ? (
          <div className="grid gap-2 border-l-2 bg-[#05070A]/46 px-3 py-2 text-[0.68rem] text-[#E5EDF5]" style={{ borderColor: homeColor }}>
            {matchResultData.motm ? (
              <p>
                MOTM{" "}
                <span style={{ color: homeColor }}>{matchResultData.motm}</span>
              </p>
            ) : null}
            {matchResultData.note ? (
              <p className="text-[#A7B2C5]">{matchResultData.note}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <footer className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-white/15 pt-3 text-[0.62rem] text-[#A7B2C5]">
        <div className="h-px bg-white/15" />
        <p
          className="rounded-[4px] border bg-[#05070A]/62 px-4 py-1.5 text-white"
          style={{ borderColor: colorAlpha(homeColor, 0.32) }}
        >
          Gosball
        </p>
        <div className="h-px bg-white/15" />
        {matchResultData.sponsor.enabled ? (
          <p className="absolute inset-x-0 -bottom-4 text-center">
            Presented by{" "}
            <span style={{ color: awayColor }}>
              {matchResultData.sponsor.brandName}
            </span>
          </p>
        ) : null}
      </footer>
    </div>
  );
}

function ResultTeamBlock({
  team,
  align,
}: {
  team: MatchResultData["homeTeam"];
  align: "left" | "right";
}) {
  return (
    <div
      className={`grid min-w-0 gap-2 ${
        align === "right" ? "justify-items-end text-right" : ""
      }`}
    >
      <TeamLogo team={team} header compact />
      <div className="min-w-0">
        <h2 className="truncate text-[1.02rem] leading-tight text-white">
          {team.name}
        </h2>
        <p className="mt-1 text-[0.58rem] uppercase text-[#A7B2C5]">
          {team.shortName}
        </p>
      </div>
    </div>
  );
}

function GoalList({
  title,
  color,
  scorers,
  teamName,
  alignRight = false,
}: {
  title: string;
  color: string;
  scorers: MatchResultData["scorers"];
  teamName: string;
  alignRight?: boolean;
}) {
  return (
    <div
      className={`grid min-w-0 grid-cols-[auto_1fr] items-start gap-3 border bg-[#05070A]/54 px-3 py-2 ${
        alignRight ? "text-right" : ""
      }`}
      style={{
        borderColor: colorAlpha(color, 0.28),
      }}
    >
      <span
        className="mt-1 h-full min-h-8 w-[3px]"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <p className="truncate text-[0.58rem] uppercase text-[#A7B2C5]">
          {title} / {teamName}
        </p>
        <div className="mt-1 grid gap-1">
        {scorers.length ? (
          scorers.map((scorer) => (
            <p
              key={scorer.id}
              className="truncate text-[0.72rem] leading-tight text-[#F3F7FF]"
            >
              {scorer.playerName}
              {scorer.minute ? ` ${scorer.minute}` : ""}
              {scorer.type !== "NORMAL" ? ` (${scorer.type})` : ""}
            </p>
          ))
        ) : (
          <p className="text-[0.64rem] text-[#64748D]">No goals</p>
        )}
        </div>
      </div>
    </div>
  );
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
