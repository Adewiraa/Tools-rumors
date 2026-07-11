"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Database,
  Download,
  ImagePlus,
  MapPin,
  Plus,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { FlagBadge } from "@/components/gosball/flag-badge";
import { countryOptions, type CountryOption } from "@/lib/countries";
import { formationOptions, formationTemplates } from "@/lib/gosball-fixtures";
import { indonesianClubs } from "@/lib/indonesian-clubs";
import { getRumorCategory } from "@/lib/rumor-categories";
import type {
  CanvasAspectRatio,
  FormationName,
  MatchdayLineupData,
  Player,
  PlayerPosition,
  RumorStatus,
  TeamLineup,
  ToolMode,
  TransferRumorData,
} from "@/types/gosball";

interface ControlSidebarProps {
  mode: ToolMode;
  aspectRatio: CanvasAspectRatio;
  lineupData: MatchdayLineupData;
  rumorData: TransferRumorData;
  isExporting: boolean;
  onModeChange: (mode: ToolMode) => void;
  onAspectRatioChange: (aspectRatio: CanvasAspectRatio) => void;
  onLineupChange: (data: MatchdayLineupData) => void;
  onRumorChange: (data: TransferRumorData) => void;
  onFormationChange: (
    teamKey: "homeTeam" | "awayTeam",
    formation: FormationName,
  ) => void;
  onDownload: () => void;
}

interface ILeagueImportResponse {
  teamName: string;
  shortName: string;
  coachName: string;
  players: Array<{
    id: string;
    name: string;
    shirtNumber: number;
    nationality: string;
    countryCode: string;
  }>;
}

interface CountriesSearchResponse {
  countries: CountryOption[];
  error?: string;
}

interface ClubOption {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  ileagueSlug: string | null;
  ileagueUrl: string | null;
  primaryColor: string;
  logoStoragePath: string | null;
  logoUrl: string | null;
  city: string | null;
  coachName: string | null;
}

interface ClubsResponse {
  clubs: ClubOption[];
  source: "local" | "supabase";
  error?: string;
}

interface RosterSearchResponse {
  players: Array<{
    roster_id: string;
    player_id: string;
    full_name: string;
    display_name: string | null;
    country_code: string;
    country_name: string | null;
    country_flag_url: string | null;
    shirt_number: number | null;
    position: string;
  }>;
  source: "local" | "supabase";
  error?: string;
}

type SaveStatus = "idle" | "saving" | "success" | "error";
type MasterView = "clubs" | "players";

const superLeagueForeignRules = {
  registered: 11,
  dsp: 9,
  field: 7,
};

const defaultClubForm = {
  name: "",
  shortName: "",
  slug: "",
  city: "",
  coachName: "",
  ileagueSlug: "",
  ileagueUrl: "",
  logoStoragePath: "",
  logoPublicUrl: "",
  primaryColor: "#533AFD",
  secondaryColor: "#E5EDF5",
};

const defaultPlayerCountry = countryOptions.find(
  (country) => country.code === "ID",
);

const rumorStatuses: RumorStatus[] = ["Rumor", "Advanced Talks", "Here We Go"];
const teamColorOptions = [
  "#2563eb",
  "#1d4ed8",
  "#0f52ba",
  "#0891b2",
  "#06b6d4",
  "#0f766e",
  "#dc2626",
  "#b91c1c",
  "#ef4444",
  "#f97316",
  "#16a34a",
  "#15803d",
  "#22c55e",
  "#f59e0b",
  "#facc15",
  "#eab308",
  "#7c3aed",
  "#6d28d9",
  "#a855f7",
  "#db2777",
  "#be123c",
  "#f43f5e",
  "#f3efe2",
  "#ffffff",
  "#a3a3a3",
  "#525252",
  "#111827",
  "#020617",
  "#b7ff5a",
  "#84cc16",
  "#000000",
];

const localClubOptions: ClubOption[] = indonesianClubs.map((club) => ({
  id: club.slug,
  name: club.name,
  shortName: club.shortName,
  slug: club.slug,
  ileagueSlug: club.ileagueSlug,
  ileagueUrl: club.ileagueUrl,
  primaryColor: club.primaryColor,
  logoStoragePath: null,
  logoUrl: null,
  city: null,
  coachName: null,
}));

const emptyPlayerName = (player: Player) => player.name.trim().length === 0;

const hasLineupPlayer = (player: Player) => !emptyPlayerName(player);

const isForeignPlayer = (player: Player) => {
  const countryCode = player.countryCode?.toUpperCase();

  if (countryCode) {
    return countryCode !== "ID";
  }

  return player.isForeign === true;
};

const countForeignPlayers = (players: Player[]) =>
  players.filter((player) => hasLineupPlayer(player) && isForeignPlayer(player))
    .length;

const getForeignRegistration = (players: Player[]) => {
  const foreignPlayers = players.filter(isForeignPlayer);
  const registeredForeignPlayers = foreignPlayers.slice(
    0,
    superLeagueForeignRules.registered,
  );
  const registeredForeignIds = new Set(
    registeredForeignPlayers.map((player) => player.id),
  );
  const unregisteredForeignPlayers = foreignPlayers.slice(
    superLeagueForeignRules.registered,
  );
  const unregisteredForeignIds = new Set(
    unregisteredForeignPlayers.map((player) => player.id),
  );

  return {
    foreignPlayers,
    registeredForeignPlayers,
    registeredForeignIds,
    unregisteredForeignPlayers,
    unregisteredForeignIds,
    eligiblePlayers: players.filter(
      (player) => !isForeignPlayer(player) || registeredForeignIds.has(player.id),
    ),
  };
};

const normalizePlayerPosition = (position: string | null | undefined): PlayerPosition => {
  if (
    position === "GK" ||
    position === "DF" ||
    position === "MF" ||
    position === "FW" ||
    position === "Coach"
  ) {
    return position;
  }

  return "Unknown";
};

const createEmptySlotPlayer = (
  teamId: string,
  slotId: string,
  position: PlayerPosition,
): Player => ({
  id: `${teamId}-${slotId}`,
  name: "",
  position,
  nationality: "Indonesia",
  countryCode: "ID",
  isForeign: false,
});

const createStarterSlots = (
  teamId: string,
  formation: FormationName,
  currentPlayers: Player[] = [],
) =>
  formationTemplates[formation].coordinates.map((coordinate, index) => ({
    ...createEmptySlotPlayer(teamId, coordinate.id, coordinate.position),
    ...currentPlayers[index],
    id: currentPlayers[index]?.id || `${teamId}-${coordinate.id}`,
    position: coordinate.position,
  }));

const createSubstituteSlots = (
  teamId: string,
  currentPlayers: Player[] = [],
  count = 10,
) =>
  Array.from({ length: count }, (_, index) => ({
    ...createEmptySlotPlayer(teamId, `sub-${index + 1}`, "Unknown"),
    ...currentPlayers[index],
    id: currentPlayers[index]?.id || `${teamId}-sub-${index + 1}`,
    position: currentPlayers[index]?.position ?? "Unknown",
  }));

const fillEmptyLineupSlots = (
  team: TeamLineup,
  rosterPlayers: Player[],
): Pick<TeamLineup, "starters" | "substitutes"> => {
  const { eligiblePlayers } = getForeignRegistration(rosterPlayers);
  const usedPlayerIds = new Set<string>();
  let starterForeignCount = 0;
  let dspForeignCount = 0;

  const canAddPlayer = (player: Player, target: "starter" | "substitute") => {
    if (!isForeignPlayer(player)) {
      return true;
    }

    if (dspForeignCount >= superLeagueForeignRules.dsp) {
      return false;
    }

    if (
      target === "starter" &&
      starterForeignCount >= superLeagueForeignRules.field
    ) {
      return false;
    }

    return true;
  };

  const markPlayerUsed = (player: Player, target: "starter" | "substitute") => {
    usedPlayerIds.add(player.id);

    if (!isForeignPlayer(player)) {
      return;
    }

    dspForeignCount += 1;

    if (target === "starter") {
      starterForeignCount += 1;
    }
  };

  const takeMatchingPlayer = (
    position: PlayerPosition,
    target: "starter" | "substitute",
  ) => {
    const player = eligiblePlayers.find(
      (candidate) =>
        !usedPlayerIds.has(candidate.id) &&
        candidate.position === position &&
        canAddPlayer(candidate, target),
    );

    if (player) {
      markPlayerUsed(player, target);
    }

    return player;
  };

  const starters = createStarterSlots(team.id, team.formation, team.starters).map(
    (slot) => {
      if (!emptyPlayerName(slot)) {
        markPlayerUsed(slot, "starter");
        return slot;
      }

      const rosterPlayer = takeMatchingPlayer(slot.position, "starter");

      return rosterPlayer
        ? {
            ...rosterPlayer,
            position: slot.position,
          }
        : slot;
    },
  );

  const substitutes = createSubstituteSlots(
    team.id,
    team.substitutes,
  ).map((slot) => {
    if (!emptyPlayerName(slot)) {
      markPlayerUsed(slot, "substitute");
      return slot;
    }

    const rosterPlayer = eligiblePlayers.find(
      (candidate) =>
        !usedPlayerIds.has(candidate.id) &&
        canAddPlayer(candidate, "substitute"),
    );

    if (!rosterPlayer) {
      return slot;
    }

    markPlayerUsed(rosterPlayer, "substitute");

    return rosterPlayer;
  });

  return { starters, substitutes };
};

export function ControlSidebar({
  mode,
  aspectRatio,
  lineupData,
  rumorData,
  isExporting,
  onModeChange,
  onAspectRatioChange,
  onLineupChange,
  onRumorChange,
  onFormationChange,
  onDownload,
}: ControlSidebarProps) {
  const activeSponsor =
    mode === "lineup" ? lineupData.sponsor : rumorData.sponsor;
  const [availableClubs, setAvailableClubs] =
    useState<ClubOption[]>(localClubOptions);

  const reloadClubs = useCallback(async () => {
    const response = await fetch("/api/clubs", { cache: "no-store" });
    const payload = (await response.json()) as ClubsResponse;

    if (!response.ok || !Array.isArray(payload.clubs)) {
      throw new Error(payload.error ?? "Gagal memuat master klub.");
    }

    if (payload.clubs.length) {
      setAvailableClubs(payload.clubs);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    reloadClubs()
      .catch(() => {
        if (isMounted) {
          setAvailableClubs(localClubOptions);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadClubs]);

  const updateSponsor = (enabled: boolean) => {
    if (mode === "lineup") {
      onLineupChange({
        ...lineupData,
        sponsor: { ...lineupData.sponsor, enabled },
      });
      return;
    }

    onRumorChange({
      ...rumorData,
      sponsor: { ...rumorData.sponsor, enabled },
    });
  };

  return (
    <aside className="order-2 flex flex-col border-t border-[#D4DEE9] bg-white/92 pb-[env(safe-area-inset-bottom)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:order-1 lg:h-dvh lg:border-r lg:border-t-0 lg:pb-0">
      <div className="relative overflow-hidden border-b border-[#D4DEE9] p-3 sm:p-6">
        <div className="absolute -right-14 -top-14 h-36 w-36 rounded-[32px] bg-[linear-gradient(135deg,rgba(83,58,253,0.12),rgba(255,97,24,0.08))]" />
        <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
          <div>
            <p className="studio-label text-[#533AFD]">
              Studio desk
            </p>
            <h1 className="display-type mt-2 text-2xl leading-none tracking-[-0.04em] text-[#061B31] sm:text-3xl">
              Media Tools
            </h1>
          </div>
          <div className="shrink-0">
            <GosballHeaderLogo />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 rounded-[6px] sm:gap-2 border border-[#D4DEE9] bg-[#F6F9FC] p-1">
          <TabButton
            active={mode === "lineup"}
            label="Matchday Line-Up"
            icon={<UsersRound className="h-4 w-4" />}
            onClick={() => onModeChange("lineup")}
          />
          <TabButton
            active={mode === "rumor"}
            label="Rumor Transfer"
            icon={<BadgePercent className="h-4 w-4" />}
            onClick={() => onModeChange("rumor")}
          />
          <TabButton
            active={mode === "master"}
            label="Master Data"
            icon={<Database className="h-4 w-4" />}
            onClick={() => onModeChange("master")}
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-visible p-3 sm:space-y-6 sm:p-6 lg:overflow-y-auto">
        {mode !== "master" ? (
          <Panel title="Canvas Ratio" icon={<SlidersHorizontal className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RadioCard
                active={aspectRatio === "1:1"}
                title="1:1"
                subtitle="Feed Post"
                onClick={() => onAspectRatioChange("1:1")}
              />
              <RadioCard
                active={aspectRatio === "9:16"}
                title="9:16"
                subtitle="IG Story"
                onClick={() => onAspectRatioChange("9:16")}
              />
            </div>
          </Panel>
        ) : null}

        {mode === "lineup" ? (
          <LineupControls
            lineupData={lineupData}
            clubs={availableClubs}
            onLineupChange={onLineupChange}
            onFormationChange={onFormationChange}
          />
        ) : mode === "rumor" ? (
          <RumorControls rumorData={rumorData} onRumorChange={onRumorChange} />
        ) : (
          <MasterDataControls
            clubs={availableClubs}
            onClubSaved={(club) =>
              setAvailableClubs((current) => {
                const withoutExisting = current.filter(
                  (item) => item.slug !== club.slug,
                );

                return [...withoutExisting, club].sort((first, second) =>
                  first.name.localeCompare(second.name),
                );
              })
            }
            onRefreshClubs={reloadClubs}
          />
        )}

        {mode !== "master" ? (
        <Panel title="Sponsor Slot" icon={<ImagePlus className="h-4 w-4" />}>
          <label className="flex items-center justify-between rounded-[5px] border border-[#D4DEE9] bg-white px-4 py-3">
            <span>
              <span className="block text-sm text-[#061B31]">
                Tampilkan sponsor
              </span>
              <span className="text-xs text-[#64748D]">
                Presented by {activeSponsor.brandName}
              </span>
            </span>
            <input
              type="checkbox"
              checked={activeSponsor.enabled}
              onChange={(event) => updateSponsor(event.target.checked)}
              className="h-5 w-5 accent-[#533AFD]"
            />
          </label>
          <input
            type="file"
            accept="image/*"
            className="mt-3 w-full rounded-[5px] border border-dashed border-[#D4DEE9] bg-white px-3 py-3 text-xs text-[#64748D] file:mr-3 file:rounded-[4px] file:border-0 file:bg-[#533AFD] file:px-3 file:py-2 file:text-xs file:text-white"
          />
        </Panel>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-40 border-t border-[#D4DEE9] bg-white/95 p-3 shadow-[0_-10px_30px_rgba(6,27,49,0.08)] backdrop-blur lg:static lg:p-6 lg:shadow-none">
        {mode !== "master" ? (
          <button
          type="button"
          onClick={onDownload}
          disabled={isExporting}
          className="pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[#533AFD] px-5 py-3 text-sm text-white shadow-[0_14px_32px_rgba(83,58,253,0.20)] disabled:cursor-not-allowed disabled:opacity-70 sm:py-4"
        >
          <Download className="h-5 w-5" />
          {isExporting ? "Exporting..." : "Download PNG HD"}
          </button>
        ) : (
          <div className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] px-4 py-3 text-xs text-[#64748D]">
            Master Data tersimpan ke Supabase lewat server route.
          </div>
        )}
      </div>
    </aside>
  );
}

function GosballHeaderLogo() {
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#080C11] p-[3px] shadow-[0_12px_28px_rgba(6,27,49,0.18)] ring-1 ring-[#1E293B]/15">
      <span className="absolute inset-[-4px] rounded-full border border-[#D4DEE9]/80" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/gosball.png"
        alt="Gosball"
        className="relative h-full w-full rounded-full object-cover"
      />
    </div>
  );
}

function LineupControls({
  lineupData,
  clubs,
  onLineupChange,
  onFormationChange,
}: {
  lineupData: MatchdayLineupData;
  clubs: ClubOption[];
  onLineupChange: (data: MatchdayLineupData) => void;
  onFormationChange: (
    teamKey: "homeTeam" | "awayTeam",
    formation: FormationName,
  ) => void;
}) {
  const updateTeam = (
    teamKey: "homeTeam" | "awayTeam",
    teamUpdate: Partial<TeamLineup>,
  ) => {
    onLineupChange({
      ...lineupData,
      [teamKey]: {
        ...lineupData[teamKey],
        ...teamUpdate,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Panel title="Match Setup" icon={<MapPin className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Kompetisi">
            <input
              value={lineupData.competitionName}
              onChange={(event) =>
                onLineupChange({
                  ...lineupData,
                  competitionName: event.target.value,
                })
              }
              className="control-input"
            />
          </Field>
          <Field label="Matchday">
            <input
              value={lineupData.matchLabel}
              onChange={(event) =>
                onLineupChange({
                  ...lineupData,
                  matchLabel: event.target.value,
                })
              }
              className="control-input"
            />
          </Field>
        </div>
        <Field label="Venue">
          <input
            value={lineupData.venue ?? ""}
            onChange={(event) =>
              onLineupChange({
                ...lineupData,
                venue: event.target.value,
              })
            }
            className="control-input"
          />
        </Field>
      </Panel>

      <TeamControls
        title="Home Team"
        teamKey="homeTeam"
        team={lineupData.homeTeam}
        clubs={clubs}
        onTeamChange={updateTeam}
        onFormationChange={onFormationChange}
      />

      <TeamControls
        title="Away Team"
        teamKey="awayTeam"
        team={lineupData.awayTeam}
        clubs={clubs}
        onTeamChange={updateTeam}
        onFormationChange={onFormationChange}
      />
    </div>
  );
}

function TeamControls({
  title,
  teamKey,
  team,
  clubs,
  onTeamChange,
  onFormationChange,
}: {
  title: string;
  teamKey: "homeTeam" | "awayTeam";
  team: TeamLineup;
  clubs: ClubOption[];
  onTeamChange: (
    teamKey: "homeTeam" | "awayTeam",
    teamUpdate: Partial<TeamLineup>,
  ) => void;
  onFormationChange: (
    teamKey: "homeTeam" | "awayTeam",
    formation: FormationName,
  ) => void;
}) {
  const [selectedClubSlug, setSelectedClubSlug] = useState("");
  const [rosterSuggestions, setRosterSuggestions] = useState<Player[]>([]);
  const [importStatus, setImportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const foreignRegistration = useMemo(
    () => getForeignRegistration(rosterSuggestions),
    [rosterSuggestions],
  );
  const starterForeignCount = useMemo(
    () => countForeignPlayers(team.starters),
    [team.starters],
  );
  const dspForeignCount = useMemo(
    () => countForeignPlayers([...team.starters, ...team.substitutes]),
    [team.starters, team.substitutes],
  );
  const selectedPlayerIds = useMemo(() => {
    const ids = new Set<string>();

    [...team.starters, ...team.substitutes].forEach((player) => {
      if (hasLineupPlayer(player)) {
        ids.add(player.id);
      }
    });

    return ids;
  }, [team.starters, team.substitutes]);
  const outsideDspPlayers = useMemo(
    () => rosterSuggestions.filter((player) => !selectedPlayerIds.has(player.id)),
    [rosterSuggestions, selectedPlayerIds],
  );

  const getRosterOptionState = (
    suggestion: Player,
    currentPlayer: Player,
    target: "starter" | "substitute",
  ) => {
    if (suggestion.id === currentPlayer.id) {
      return { disabled: false, reason: "" };
    }

    if (selectedPlayerIds.has(suggestion.id)) {
      return { disabled: true, reason: "sudah dipilih" };
    }

    const suggestionIsForeign = isForeignPlayer(suggestion);

    if (
      suggestionIsForeign &&
      !foreignRegistration.registeredForeignIds.has(suggestion.id)
    ) {
      return { disabled: true, reason: "di luar 11 asing" };
    }

    if (!suggestionIsForeign) {
      return { disabled: false, reason: "" };
    }

    const currentPlayerIsForeign =
      hasLineupPlayer(currentPlayer) && isForeignPlayer(currentPlayer);
    const nextDspForeignCount =
      dspForeignCount - (currentPlayerIsForeign ? 1 : 0) + 1;
    const nextStarterForeignCount =
      target === "starter"
        ? starterForeignCount - (currentPlayerIsForeign ? 1 : 0) + 1
        : starterForeignCount;

    if (nextDspForeignCount > superLeagueForeignRules.dsp) {
      return { disabled: true, reason: "DSP max 9 asing" };
    }

    if (nextStarterForeignCount > superLeagueForeignRules.field) {
      return { disabled: true, reason: "lapangan max 7 asing" };
    }

    return { disabled: false, reason: "" };
  };

  const canApplyCountryToPlayer = (
    currentPlayer: Player,
    country: CountryOption,
    target: "starter" | "substitute",
  ) => {
    if (country.code === "ID") {
      return true;
    }

    const currentPlayerIsForeign =
      hasLineupPlayer(currentPlayer) && isForeignPlayer(currentPlayer);
    const nextDspForeignCount =
      dspForeignCount - (currentPlayerIsForeign ? 1 : 0) + 1;
    const nextStarterForeignCount =
      target === "starter"
        ? starterForeignCount - (currentPlayerIsForeign ? 1 : 0) + 1
        : starterForeignCount;

    return (
      nextDspForeignCount <= superLeagueForeignRules.dsp &&
      nextStarterForeignCount <= superLeagueForeignRules.field
    );
  };

  const updateStarterCountry = (index: number, country: CountryOption) => {
    if (!canApplyCountryToPlayer(team.starters[index], country, "starter")) {
      return;
    }

    onTeamChange(teamKey, {
      starters: team.starters.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              countryCode: country.code,
              countryFlagUrl: country.flagSvgUrl ?? country.flagPngUrl,
              nationality: country.name,
              isForeign: country.code !== "ID",
            }
          : player,
      ),
    });
  };

  const updateSubstituteCountry = (index: number, country: CountryOption) => {
    if (!canApplyCountryToPlayer(team.substitutes[index], country, "substitute")) {
      return;
    }

    onTeamChange(teamKey, {
      substitutes: team.substitutes.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              countryCode: country.code,
              countryFlagUrl: country.flagSvgUrl ?? country.flagPngUrl,
              nationality: country.name,
              isForeign: country.code !== "ID",
            }
          : player,
      ),
    });
  };

  const getRosterSuggestionsForPosition = (position: PlayerPosition) => {
    if (position === "Unknown") {
      return rosterSuggestions;
    }

    return rosterSuggestions.filter((player) => player.position === position);
  };

  const getLatestSelectedClub = async (selectedClub: ClubOption) => {
    try {
      const response = await fetch("/api/clubs", { cache: "no-store" });
      const payload = (await response.json()) as ClubsResponse;

      if (!response.ok || !Array.isArray(payload.clubs)) {
        return selectedClub;
      }

      return (
        payload.clubs.find((club) => club.slug === selectedClub.slug) ??
        selectedClub
      );
    } catch {
      return selectedClub;
    }
  };

  const applyRosterPlayerToStarter = (index: number, playerId: string) => {
    const rosterPlayer = rosterSuggestions.find((player) => player.id === playerId);
    const currentPlayer = team.starters[index];

    if (
      rosterPlayer &&
      getRosterOptionState(rosterPlayer, currentPlayer, "starter").disabled
    ) {
      return;
    }

    onTeamChange(teamKey, {
      starters: team.starters.map((player, playerIndex) => {
        if (playerIndex !== index) {
          return player;
        }

        if (!rosterPlayer) {
          return {
            ...player,
            id: `${team.id}-starter-${index + 1}`,
            name: "",
            shirtNumber: undefined,
            nationality: "Indonesia",
            countryCode: "ID",
            countryFlagUrl: undefined,
            isForeign: false,
          };
        }

        return {
          ...rosterPlayer,
          position: player.position,
        };
      }),
    });
  };

  const applyRosterPlayerToSubstitute = (index: number, playerId: string) => {
    const rosterPlayer = rosterSuggestions.find((player) => player.id === playerId);
    const currentPlayer = team.substitutes[index];

    if (
      rosterPlayer &&
      getRosterOptionState(rosterPlayer, currentPlayer, "substitute").disabled
    ) {
      return;
    }

    onTeamChange(teamKey, {
      substitutes: team.substitutes.map((player, playerIndex) => {
        if (playerIndex !== index) {
          return player;
        }

        if (!rosterPlayer) {
          return {
            ...player,
            id: `${team.id}-sub-${index + 1}`,
            name: "",
            shirtNumber: undefined,
            nationality: "Indonesia",
            countryCode: "ID",
            countryFlagUrl: undefined,
            isForeign: false,
          };
        }

        return rosterPlayer;
      }),
    });
  };

  const selectClub = (clubSlug: string) => {
    const selectedClub = clubs.find((club) => club.slug === clubSlug);

    setSelectedClubSlug(clubSlug);
    setRosterSuggestions([]);
    setImportStatus("idle");

    if (!selectedClub) {
      return;
    }

    onTeamChange(teamKey, {
      name: selectedClub.name,
      shortName: selectedClub.shortName,
      primaryColor: selectedClub.primaryColor,
      logoUrl: selectedClub.logoUrl ?? undefined,
      coach: {
        ...team.coach,
        name: selectedClub.coachName ?? "",
      },
    });

    void importSelectedClubRoster(selectedClub);
  };

  const importSelectedClubRoster = async (clubOverride?: ClubOption) => {
    const selectedClub =
      clubOverride ?? clubs.find((club) => club.slug === selectedClubSlug);

    if (!selectedClub) {
      setImportStatus("error");
      return;
    }

    try {
      setImportStatus("loading");
      const latestSelectedClub = await getLatestSelectedClub(selectedClub);
      const rosterResponse = await fetch(`/api/clubs/${latestSelectedClub.slug}/roster`);
      const rosterPayload =
        (await rosterResponse.json()) as RosterSearchResponse | { error: string };

      if (
        rosterResponse.ok &&
        !("error" in rosterPayload) &&
        rosterPayload.players.length > 0
      ) {
        const databasePlayers = rosterPayload.players.map(
          (player, index): Player => ({
            id: player.player_id,
            name: player.display_name ?? player.full_name,
            position: normalizePlayerPosition(player.position),
            shirtNumber: player.shirt_number ?? index + 1,
            nationality: player.country_name ?? player.country_code,
            countryCode: player.country_code,
            countryFlagUrl: player.country_flag_url ?? undefined,
            isForeign: player.country_code !== "ID",
          }),
        );
        const filledSlots = fillEmptyLineupSlots(team, databasePlayers);

        onTeamChange(teamKey, {
          name: latestSelectedClub.name,
          shortName: latestSelectedClub.shortName,
          primaryColor: latestSelectedClub.primaryColor,
          logoUrl: latestSelectedClub.logoUrl ?? undefined,
          coach: {
            ...team.coach,
            name: latestSelectedClub.coachName ?? "",
          },
          starters: filledSlots.starters,
          substitutes: filledSlots.substitutes,
        });
        setRosterSuggestions(databasePlayers);
        setImportStatus("success");
        return;
      }

      if (!latestSelectedClub.ileagueUrl) {
        onTeamChange(teamKey, {
          name: latestSelectedClub.name,
          shortName: latestSelectedClub.shortName,
          primaryColor: latestSelectedClub.primaryColor,
          logoUrl: latestSelectedClub.logoUrl ?? undefined,
          coach: {
            ...team.coach,
            name: latestSelectedClub.coachName ?? "",
          },
        });
        setImportStatus("error");
        return;
      }

      const response = await fetch(
        `/api/ileague/club?url=${encodeURIComponent(latestSelectedClub.ileagueUrl)}`,
      );
      const payload = (await response.json()) as
        | ILeagueImportResponse
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Import gagal");
      }

      if (payload.players.length === 0) {
        onTeamChange(teamKey, {
          name: latestSelectedClub.name,
          shortName: latestSelectedClub.shortName,
          primaryColor: latestSelectedClub.primaryColor,
          logoUrl: latestSelectedClub.logoUrl ?? undefined,
          coach: {
            ...team.coach,
            name: latestSelectedClub.coachName ?? "",
          },
        });
        setImportStatus("error");
        return;
      }

      const importedPlayers = payload.players.map((player, index): Player => {
        return {
          id: player.id,
          name: player.name,
          position: "Unknown",
          shirtNumber: player.shirtNumber,
          nationality: player.nationality,
          countryCode: player.countryCode,
          isForeign: player.countryCode !== "ID",
        };
      });
      setRosterSuggestions(importedPlayers);
      const filledSlots = fillEmptyLineupSlots(team, importedPlayers);

      onTeamChange(teamKey, {
        name: payload.teamName || latestSelectedClub.name,
        shortName: payload.shortName || latestSelectedClub.shortName,
        primaryColor: latestSelectedClub.primaryColor,
        logoUrl: latestSelectedClub.logoUrl ?? undefined,
        starters: filledSlots.starters,
        substitutes: filledSlots.substitutes,
        coach: {
          ...team.coach,
          name: payload.coachName || latestSelectedClub.coachName || "",
        },
      });
      setImportStatus("success");
    } catch {
      setImportStatus("error");
    }
  };

  return (
    <Panel title={title} icon={<UsersRound className="h-4 w-4" />}>
      <div className="grid gap-2 rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_5.25rem]">
          <select
            value={selectedClubSlug}
            onChange={(event) => selectClub(event.target.value)}
            className="control-input min-w-0 truncate pr-8 text-xs"
            title={
              clubs.find((club) => club.slug === selectedClubSlug)
                ?.name ?? "Pilih klub Liga"
            }
          >
            <option value="">Pilih klub Liga...</option>
            {clubs.map((club) => (
              <option key={club.slug} value={club.slug}>
                {club.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => importSelectedClubRoster()}
            disabled={importStatus === "loading"}
            className="pressable min-h-12 rounded-[4px] bg-[#533AFD] px-3 text-[0.7rem] text-white disabled:opacity-60"
          >
            {importStatus === "loading" ? "..." : "Muat"}
          </button>
        </div>
        <p className="text-[0.68rem] text-[#64748D]">
          {importStatus === "success"
            ? "Roster klub berhasil dimuat."
            : importStatus === "error"
              ? "Klub dimuat. Roster database belum tersedia, isi pemain manual dulu."
              : "Pilih klub, lalu muat roster dari database."}
        </p>
      </div>

      <SuperLeagueForeignSummary
        rosterForeignCount={foreignRegistration.foreignPlayers.length}
        unregisteredForeignCount={
          foreignRegistration.unregisteredForeignPlayers.length
        }
        dspForeignCount={dspForeignCount}
        starterForeignCount={starterForeignCount}
      />

      <Field label="Formasi">
        <select
          value={team.formation}
          onChange={(event) =>
            onFormationChange(teamKey, event.target.value as FormationName)
          }
          className="control-input"
        >
          {formationOptions.map((formation) => (
            <option key={formation} value={formation}>
              {formation}
            </option>
          ))}
        </select>
      </Field>

      <div className="space-y-3">
        <p className="text-xs text-[#533AFD]">
          Starting XI
        </p>
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {team.starters.map((player, index) => {
            const positionPlayers = getRosterSuggestionsForPosition(player.position);

            return (
            <div key={`${team.id}-starter-${index}`} className="grid grid-cols-[1fr_3rem] gap-2">
              <Field label={`${index + 1}. ${player.position}`}>
                <select
                  value={rosterSuggestions.some((item) => item.id === player.id) ? player.id : ""}
                  onChange={(event) =>
                    applyRosterPlayerToStarter(index, event.target.value)
                  }
                  className="control-input"
                >
                  <option value="">
                    {positionPlayers.length
                      ? `Pilih ${player.position}`
                      : `${player.position} belum ada di roster`}
                  </option>
                  {positionPlayers.map((suggestion) => {
                    const optionState = getRosterOptionState(
                      suggestion,
                      player,
                      "starter",
                    );

                    return (
                      <option
                        key={suggestion.id}
                        value={suggestion.id}
                        disabled={optionState.disabled}
                      >
                        {suggestion.shirtNumber ? `${suggestion.shirtNumber} - ` : ""}
                        {suggestion.name}
                        {optionState.reason ? ` (${optionState.reason})` : ""}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <Field label="Flag">
                <CountryPicker
                  value={player.countryCode}
                  onChange={(country) => updateStarterCountry(index, country)}
                />
              </Field>
            </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-[#533AFD]">
          Cadangan
        </p>
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {team.substitutes.map((player, index) => (
            <div key={`${team.id}-substitute-${index}`} className="grid grid-cols-[1fr_3rem] gap-2">
              <Field label={`Sub ${index + 1}`}>
                <select
                  value={rosterSuggestions.some((item) => item.id === player.id) ? player.id : ""}
                  onChange={(event) =>
                    applyRosterPlayerToSubstitute(index, event.target.value)
                  }
                  className="control-input"
                >
                  <option value="">
                    {rosterSuggestions.length ? "Pilih pemain" : "Roster belum dimuat"}
                  </option>
                  {rosterSuggestions.map((suggestion) => {
                    const optionState = getRosterOptionState(
                      suggestion,
                      player,
                      "substitute",
                    );

                    return (
                      <option
                        key={suggestion.id}
                        value={suggestion.id}
                        disabled={optionState.disabled}
                      >
                        {suggestion.shirtNumber ? `${suggestion.shirtNumber} - ` : ""}
                        {suggestion.name} / {suggestion.position}
                        {optionState.reason ? ` (${optionState.reason})` : ""}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <Field label="Flag">
                <CountryPicker
                  value={player.countryCode}
                  onChange={(country) => updateSubstituteCountry(index, country)}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <OutsideDspPlayers
        players={outsideDspPlayers}
        unregisteredForeignIds={foreignRegistration.unregisteredForeignIds}
      />
    </Panel>
  );
}

function SuperLeagueForeignSummary({
  rosterForeignCount,
  unregisteredForeignCount,
  dspForeignCount,
  starterForeignCount,
}: {
  rosterForeignCount: number;
  unregisteredForeignCount: number;
  dspForeignCount: number;
  starterForeignCount: number;
}) {
  return (
    <div className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="studio-label text-[#533AFD]">Regulasi Super League</p>
        {unregisteredForeignCount > 0 ? (
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[0.62rem] text-red-700">
            {unregisteredForeignCount} luar kuota
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ForeignQuotaPill
          label="Roster"
          count={rosterForeignCount}
          max={superLeagueForeignRules.registered}
        />
        <ForeignQuotaPill
          label="DSP"
          count={dspForeignCount}
          max={superLeagueForeignRules.dsp}
        />
        <ForeignQuotaPill
          label="Lapangan"
          count={starterForeignCount}
          max={superLeagueForeignRules.field}
        />
      </div>
    </div>
  );
}

function ForeignQuotaPill({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const isOverLimit = count > max;
  const isFull = count === max;

  return (
    <div
      className={`rounded-[5px] border px-2 py-2 ${
        isOverLimit
          ? "border-red-200 bg-red-50 text-red-700"
          : isFull
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-[#D4DEE9] bg-white text-[#061B31]"
      }`}
    >
      <span className="block text-[0.58rem] text-current/70">{label}</span>
      <span className="block text-sm tabular-nums">
        {count}/{max}
      </span>
    </div>
  );
}

function OutsideDspPlayers({
  players,
  unregisteredForeignIds,
}: {
  players: Player[];
  unregisteredForeignIds: Set<string>;
}) {
  return (
    <div className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="studio-label text-[#533AFD]">Di luar DSP</p>
        <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] text-[#64748D]">
          {players.length} pemain
        </span>
      </div>
      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {players.map((player) => {
          const playerIsForeign = isForeignPlayer(player);
          const isUnregisteredForeign = unregisteredForeignIds.has(player.id);

          return (
            <div
              key={player.id}
              className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-2 rounded-[5px] border border-[#D4DEE9] bg-white px-3 py-2"
            >
              <span className="text-xs tabular-nums text-[#64748D]">
                {player.shirtNumber ?? "-"}
              </span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5">
                  {playerIsForeign ? (
                    <FlagBadge
                      code={player.countryCode}
                      label={player.nationality}
                      flagUrl={player.countryFlagUrl}
                    />
                  ) : null}
                  <span className="truncate text-sm text-[#061B31]">
                    {player.name}
                  </span>
                </span>
                <span className="block truncate text-[0.68rem] text-[#64748D]">
                  {player.position} / {player.nationality ?? player.countryCode}
                </span>
              </span>
              {isUnregisteredForeign ? (
                <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[0.58rem] text-red-700">
                  luar 11
                </span>
              ) : playerIsForeign ? (
                <span className="rounded-full border border-[#D4DEE9] bg-[#F6F9FC] px-2 py-1 text-[0.58rem] text-[#64748D]">
                  asing
                </span>
              ) : null}
            </div>
          );
        })}
        {players.length === 0 ? (
          <p className="rounded-[5px] border border-dashed border-[#D4DEE9] bg-white p-3 text-sm text-[#64748D]">
            Semua pemain roster sudah masuk DSP atau roster belum dimuat.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MasterDataControls({
  clubs,
  onClubSaved,
  onRefreshClubs,
}: {
  clubs: ClubOption[];
  onClubSaved: (club: ClubOption) => void;
  onRefreshClubs: () => Promise<void>;
}) {
  const [masterView, setMasterView] = useState<MasterView>("clubs");
  const [clubForm, setClubForm] = useState(defaultClubForm);
  const [playerForm, setPlayerForm] = useState({
    clubSlug: "",
    seasonCode: "BRI_SUPER_LEAGUE_2025-26",
    fullName: "",
    displayName: "",
    shirtNumber: "",
    position: "Unknown" as Player["position"],
    sourceUrl: "",
    country: defaultPlayerCountry,
  });
  const [clubStatus, setClubStatus] = useState<SaveStatus>("idle");
  const [clubMessage, setClubMessage] = useState("");
  const [clubLogoStatus, setClubLogoStatus] = useState<SaveStatus>("idle");
  const [clubLogoMessage, setClubLogoMessage] = useState("");
  const [playerStatus, setPlayerStatus] = useState<SaveStatus>("idle");
  const [playerMessage, setPlayerMessage] = useState("");
  const [rosterPlayers, setRosterPlayers] = useState<
    RosterSearchResponse["players"]
  >([]);
  const [rosterStatus, setRosterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [rosterMessage, setRosterMessage] = useState("");

  const selectedPlayerClub = clubs.find(
    (club) => club.slug === playerForm.clubSlug,
  );

  const loadRosterPlayers = useCallback(
    async (clubSlug = playerForm.clubSlug) => {
      if (!clubSlug) {
        setRosterPlayers([]);
        setRosterStatus("idle");
        setRosterMessage("Pilih klub untuk melihat daftar pemain.");
        return;
      }

      setRosterStatus("loading");
      setRosterMessage("");

      const response = await fetch(
        `/api/clubs/${clubSlug}/roster?season=${encodeURIComponent(
          playerForm.seasonCode,
        )}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as RosterSearchResponse;

      if (!response.ok || !Array.isArray(payload.players)) {
        throw new Error(payload.error ?? "Gagal memuat pemain klub.");
      }

      setRosterPlayers(payload.players);
      setRosterStatus("success");
      setRosterMessage(
        payload.players.length
          ? `${payload.players.length} pemain tersimpan.`
          : "Belum ada pemain untuk klub ini.",
      );
    },
    [playerForm.clubSlug, playerForm.seasonCode],
  );

  useEffect(() => {
    if (playerForm.clubSlug || clubs.length === 0) {
      return;
    }

    setPlayerForm((current) => ({
      ...current,
      clubSlug: current.clubSlug || clubs[0]?.slug || "",
    }));
  }, [clubs, playerForm.clubSlug]);

  useEffect(() => {
    if (masterView !== "players") {
      return;
    }

    loadRosterPlayers().catch((error) => {
      setRosterStatus("error");
      setRosterMessage(
        error instanceof Error ? error.message : "Gagal memuat pemain klub.",
      );
    });
  }, [loadRosterPlayers, masterView]);

  const editClub = (club: ClubOption) => {
    setClubForm((current) => ({
      ...current,
      name: club.name,
      shortName: club.shortName,
      slug: club.slug,
      city: club.city ?? "",
      ileagueSlug: club.ileagueSlug ?? "",
      ileagueUrl: club.ileagueUrl ?? "",
      logoStoragePath: club.logoStoragePath ?? "",
      logoPublicUrl: club.logoUrl ?? "",
      primaryColor: club.primaryColor,
      coachName: club.coachName ?? "",
    }));
  };

  const resetClubForm = () => {
    setClubForm(defaultClubForm);
    setClubStatus("idle");
    setClubMessage("");
    setClubLogoStatus("idle");
    setClubLogoMessage("");
  };

  const resetPlayerForm = () => {
    setPlayerForm((current) => ({
      ...current,
      fullName: "",
      displayName: "",
      shirtNumber: "",
      position: "Unknown",
      sourceUrl: "",
      country: defaultPlayerCountry,
    }));
    setPlayerStatus("idle");
    setPlayerMessage("");
  };

  const saveClub = async () => {
    try {
      setClubStatus("saving");
      setClubMessage("");

      const response = await fetch("/api/master/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubForm),
      });
      const payload = (await response.json()) as {
        club?: ClubOption;
        error?: string;
      };

      if (!response.ok || !payload.club) {
        throw new Error(payload.error ?? "Gagal menyimpan klub.");
      }

      onClubSaved(payload.club);
      let didRefreshClubs = true;
      try {
        await onRefreshClubs();
      } catch {
        didRefreshClubs = false;
      }
      setPlayerForm((current) => ({
        ...current,
        clubSlug: payload.club?.slug ?? current.clubSlug,
      }));
      setClubStatus("success");
      setClubMessage(
        didRefreshClubs
          ? "Klub berhasil disimpan dan daftar klub diperbarui."
          : "Klub berhasil disimpan, tapi daftar penuh belum bisa direfresh.",
      );
      setMasterView("clubs");
    } catch (error) {
      setClubStatus("error");
      setClubMessage(
        error instanceof Error ? error.message : "Gagal menyimpan klub.",
      );
    }
  };

  const uploadClubLogo = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setClubLogoStatus("saving");
      setClubLogoMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "clubSlug",
        clubForm.slug || clubForm.name || "club-logo",
      );

      const response = await fetch("/api/master/club-logo", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        publicUrl?: string;
        storagePath?: string;
        error?: string;
      };

      if (!response.ok || !payload.publicUrl) {
        throw new Error(payload.error ?? "Gagal upload logo klub.");
      }

      setClubForm((current) => ({
        ...current,
        logoPublicUrl: payload.publicUrl ?? "",
        logoStoragePath: payload.storagePath ?? "",
      }));
      await onRefreshClubs();
      setClubLogoStatus("success");
      setClubLogoMessage("Logo PNG transparan berhasil diupload.");
    } catch (error) {
      setClubLogoStatus("error");
      setClubLogoMessage(
        error instanceof Error ? error.message : "Gagal upload logo klub.",
      );
    }
  };

  const savePlayer = async () => {
    try {
      setPlayerStatus("saving");
      setPlayerMessage("");

      const response = await fetch("/api/master/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubSlug: playerForm.clubSlug,
          seasonCode: playerForm.seasonCode,
          fullName: playerForm.fullName,
          displayName: playerForm.displayName,
          shirtNumber: playerForm.shirtNumber,
          position: playerForm.position,
          sourceUrl: playerForm.sourceUrl,
          countryCode: playerForm.country?.code ?? "ID",
          countryName: playerForm.country?.name ?? "Indonesia",
          countryFlagUrl:
            playerForm.country?.flagSvgUrl ?? playerForm.country?.flagPngUrl,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal menyimpan pemain.");
      }

      let didRefreshPlayers = true;
      try {
        await loadRosterPlayers(playerForm.clubSlug);
      } catch {
        didRefreshPlayers = false;
      }
      setPlayerStatus("success");
      setPlayerMessage(
        didRefreshPlayers
          ? "Pemain berhasil ditambahkan dan daftar roster diperbarui."
          : "Pemain berhasil ditambahkan, tapi daftar roster belum bisa direfresh.",
      );
      setPlayerForm((current) => ({
        ...current,
        fullName: "",
        displayName: "",
        shirtNumber: "",
        sourceUrl: "",
      }));
    } catch (error) {
      setPlayerStatus("error");
      setPlayerMessage(
        error instanceof Error ? error.message : "Gagal menyimpan pemain.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-1.5 rounded-[6px] sm:gap-2 border border-[#D4DEE9] bg-[#F6F9FC] p-1">
        <button
          type="button"
          onClick={() => setMasterView("clubs")}
          className={`rounded-[5px] px-3 py-3 text-sm transition ${
            masterView === "clubs"
              ? "bg-[#533AFD] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              : "text-[#64748D] hover:bg-white"
          }`}
        >
          Master Klub
        </button>
        <button
          type="button"
          onClick={() => setMasterView("players")}
          className={`rounded-[5px] px-3 py-3 text-sm transition ${
            masterView === "players"
              ? "bg-[#533AFD] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              : "text-[#64748D] hover:bg-white"
          }`}
        >
          Master Pemain
        </button>
      </div>

      {masterView === "clubs" ? (
      <Panel title="Master Klub" icon={<Database className="h-4 w-4" />}>
        <MasterClubList clubs={clubs} onSelect={editClub} />

        <div className="flex items-center justify-between gap-3 rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] px-3 py-2">
          <p className="text-xs text-[#64748D]">
            {clubForm.slug
              ? `Mode edit: ${clubForm.name || clubForm.slug}`
              : "Mode tambah klub baru"}
          </p>
          <button
            type="button"
            onClick={resetClubForm}
            className="rounded-[4px] border border-[#D4DEE9] bg-white px-3 py-2 text-xs text-[#061B31] transition hover:border-[#533AFD] hover:text-[#533AFD]"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nama klub">
            <input
              value={clubForm.name}
              onChange={(event) =>
                setClubForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Persib Bandung"
              className="control-input"
            />
          </Field>
          <Field label="Short name">
            <input
              value={clubForm.shortName}
              onChange={(event) =>
                setClubForm((current) => ({
                  ...current,
                  shortName: event.target.value,
                }))
              }
              placeholder="PERSIB"
              className="control-input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Slug">
            <input
              value={clubForm.slug}
              onChange={(event) =>
                setClubForm((current) => ({
                  ...current,
                  slug: event.target.value,
                }))
              }
              placeholder="persib-bandung"
              className="control-input"
            />
          </Field>
          <Field label="Pelatih">
            <input
              value={clubForm.coachName}
              onChange={(event) =>
                setClubForm((current) => ({
                  ...current,
                  coachName: event.target.value,
                }))
              }
              placeholder="Nama pelatih"
              className="control-input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Kota">
            <input
              value={clubForm.city}
              onChange={(event) =>
                setClubForm((current) => ({
                  ...current,
                  city: event.target.value,
                }))
              }
              placeholder="Bandung"
              className="control-input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-[4.25rem_1fr] items-end gap-3">
          <div className="rounded-[5px] border border-[#D4DEE9] bg-white p-2">
            <ClubLogoThumb
              logoUrl={clubForm.logoPublicUrl || null}
              clubName={clubForm.name || "Logo klub"}
              primaryColor={clubForm.primaryColor}
              size="large"
            />
          </div>
          <Field label="Upload logo club">
            <input
              type="file"
              accept="image/png"
              onChange={(event) =>
                void uploadClubLogo(event.currentTarget.files?.[0] ?? null)
              }
              className="w-full rounded-[5px] border border-dashed border-[#D4DEE9] bg-white px-3 py-3 text-xs text-[#64748D] file:mr-3 file:rounded-[4px] file:border-0 file:bg-[#533AFD] file:px-3 file:py-2 file:text-xs file:text-white"
            />
          </Field>
        </div>
        <StatusMessage status={clubLogoStatus} message={clubLogoMessage} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Warna utama">
            <ColorPresetPicker
              value={clubForm.primaryColor}
              onChange={(primaryColor) =>
                setClubForm((current) => ({ ...current, primaryColor }))
              }
            />
          </Field>
          <Field label="Warna kedua">
            <input
              type="color"
              value={clubForm.secondaryColor}
              onChange={(event) =>
                setClubForm((current) => ({
                  ...current,
                  secondaryColor: event.target.value,
                }))
              }
              className="control-input p-1"
            />
          </Field>
        </div>

        <details className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-3">
          <summary className="cursor-pointer text-xs text-[#64748D]">
            Opsional iLeague
          </summary>
          <div className="mt-3 grid gap-3">
            <Field label="iLeague slug">
              <input
                value={clubForm.ileagueSlug}
                onChange={(event) =>
                  setClubForm((current) => ({
                    ...current,
                    ileagueSlug: event.target.value,
                  }))
                }
                placeholder="PERSIB_BANDUNG"
                className="control-input"
              />
            </Field>
            <Field label="iLeague URL">
              <input
                value={clubForm.ileagueUrl}
                onChange={(event) =>
                  setClubForm((current) => ({
                    ...current,
                    ileagueUrl: event.target.value,
                  }))
                }
                placeholder="https://ileague.id/..."
                className="control-input"
              />
            </Field>
          </div>
        </details>

        <SaveButton
          label="Simpan Klub"
          saving={clubStatus === "saving"}
          onClick={saveClub}
        />
        <StatusMessage status={clubStatus} message={clubMessage} />
      </Panel>
      ) : (
      <Panel title="Master Pemain" icon={<Plus className="h-4 w-4" />}>
        <div className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-3">
          <div className="flex items-start justify-between gap-3">
            <span>
              <p className="studio-label text-[#533AFD]">Roster tersimpan</p>
              <p className="mt-1 text-sm text-[#64748D]">
                {selectedPlayerClub
                  ? `${selectedPlayerClub.name} / ${playerForm.seasonCode}`
                  : "Pilih klub untuk melihat pemain."}
              </p>
            </span>
            <button
              type="button"
              onClick={resetPlayerForm}
              className="rounded-[4px] border border-[#D4DEE9] bg-white px-3 py-2 text-xs text-[#061B31] transition hover:border-[#533AFD] hover:text-[#533AFD]"
            >
              Reset
            </button>
          </div>
        </div>

        <Field label="Klub">
          <select
            value={playerForm.clubSlug}
            onChange={(event) =>
              setPlayerForm((current) => ({
                ...current,
                clubSlug: event.target.value,
              }))
            }
            className="control-input"
          >
            <option value="">Pilih klub...</option>
            {clubs.map((club) => (
              <option key={club.slug} value={club.slug}>
                {club.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nama lengkap">
            <input
              value={playerForm.fullName}
              onChange={(event) =>
                setPlayerForm((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              placeholder="Nama pemain"
              className="control-input"
            />
          </Field>
          <Field label="Nama tampil">
            <input
              value={playerForm.displayName}
              onChange={(event) =>
                setPlayerForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
              placeholder="Opsional"
              className="control-input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="No">
            <input
              value={playerForm.shirtNumber}
              onChange={(event) =>
                setPlayerForm((current) => ({
                  ...current,
                  shirtNumber: event.target.value,
                }))
              }
              inputMode="numeric"
              className="control-input"
            />
          </Field>
          <Field label="Posisi">
            <select
              value={playerForm.position}
              onChange={(event) =>
                setPlayerForm((current) => ({
                  ...current,
                  position: event.target.value as Player["position"],
                }))
              }
              className="control-input"
            >
              {["GK", "DF", "MF", "FW", "Unknown"].map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Negara">
            <CountryPicker
              value={playerForm.country?.code}
              onChange={(country) =>
                setPlayerForm((current) => ({ ...current, country }))
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Season">
            <input
              value={playerForm.seasonCode}
              onChange={(event) =>
                setPlayerForm((current) => ({
                  ...current,
                  seasonCode: event.target.value,
                }))
              }
              className="control-input"
            />
          </Field>
          <Field label="Source URL">
            <input
              value={playerForm.sourceUrl}
              onChange={(event) =>
                setPlayerForm((current) => ({
                  ...current,
                  sourceUrl: event.target.value,
                }))
              }
              placeholder="Opsional"
              className="control-input"
            />
          </Field>
        </div>

        <SaveButton
          label="Tambah Pemain"
          saving={playerStatus === "saving"}
          onClick={savePlayer}
        />
        <StatusMessage status={playerStatus} message={playerMessage} />
        <MasterPlayerList
          players={rosterPlayers}
          status={rosterStatus}
          message={rosterMessage}
        />
      </Panel>
      )}
    </div>
  );
}

function ClubLogoThumb({
  logoUrl,
  clubName,
  primaryColor,
  size = "default",
}: {
  logoUrl: string | null;
  clubName: string;
  primaryColor: string;
  size?: "default" | "large";
}) {
  const sizeClass = size === "large" ? "h-12 w-12" : "h-9 w-9";

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-[#D4DEE9] bg-white`}
      style={{ backgroundColor: logoUrl ? "#ffffff" : primaryColor }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={clubName}
          className="h-full w-full object-contain p-1"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="h-full w-full" />
      )}
    </span>
  );
}

function MasterClubList({
  clubs,
  onSelect,
}: {
  clubs: ClubOption[];
  onSelect: (club: ClubOption) => void;
}) {
  return (
    <div className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="studio-label text-[#533AFD]">Klub tersimpan</p>
        <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] text-[#64748D]">
          {clubs.length} klub
        </span>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {clubs.length ? (
          clubs.map((club) => (
            <button
              key={club.slug}
              type="button"
              onClick={() => onSelect(club)}
              className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[5px] border border-[#D4DEE9] bg-white px-3 py-2 text-left transition hover:border-[#533AFD]"
            >
              <ClubLogoThumb
                logoUrl={club.logoUrl}
                clubName={club.name}
                primaryColor={club.primaryColor}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm text-[#061B31]">
                  {club.name}
                </span>
                <span className="block truncate text-[0.68rem] text-[#64748D]">
                  {club.shortName} {club.city ? `/ ${club.city}` : ""}
                </span>
                {club.coachName ? (
                  <span className="block truncate text-[0.68rem] text-[#64748D]">
                    Pelatih: {club.coachName}
                  </span>
                ) : null}
              </span>
              <span className="text-[0.68rem] text-[#64748D]">Edit</span>
            </button>
          ))
        ) : (
          <p className="rounded-[5px] border border-dashed border-[#D4DEE9] bg-white p-3 text-sm text-[#64748D]">
            Belum ada klub tersimpan.
          </p>
        )}
      </div>
    </div>
  );
}

function MasterPlayerList({
  players,
  status,
  message,
}: {
  players: RosterSearchResponse["players"];
  status: "idle" | "loading" | "success" | "error";
  message: string;
}) {
  return (
    <div className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="studio-label text-[#533AFD]">Pemain klub</p>
        <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] text-[#64748D]">
          {status === "loading" ? "Memuat..." : `${players.length} pemain`}
        </span>
      </div>
      {message ? (
        <p
          className={`mb-3 rounded-[5px] border px-3 py-2 text-xs ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#D4DEE9] bg-white text-[#64748D]"
          }`}
        >
          {message}
        </p>
      ) : null}
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {players.map((player) => (
          <div
            key={player.roster_id}
            className="grid grid-cols-[2.4rem_1fr_auto] items-center gap-2 rounded-[5px] border border-[#D4DEE9] bg-white px-3 py-2"
          >
            <span className="text-xs text-[#64748D]">
              {player.shirt_number ?? "-"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-[#061B31]">
                {player.display_name || player.full_name}
              </span>
              <span className="block truncate text-[0.68rem] text-[#64748D]">
                {player.position} / {player.country_name || player.country_code}
              </span>
            </span>
            <FlagBadge
              code={player.country_code}
              label={player.country_name ?? player.country_code}
              flagUrl={player.country_flag_url ?? undefined}
            />
          </div>
        ))}
        {status !== "loading" && players.length === 0 ? (
          <p className="rounded-[5px] border border-dashed border-[#D4DEE9] bg-white p-3 text-sm text-[#64748D]">
            Belum ada pemain tersimpan untuk klub ini.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ColorPresetPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5 rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-1.5">
      <div className="grid grid-cols-8 gap-1.5">
      {teamColorOptions.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-8 rounded-md border transition ${
            value.toLowerCase() === color.toLowerCase()
              ? "border-[#061B31] ring-2 ring-[#533AFD]/35"
              : "border-[#D4DEE9] hover:border-[#533AFD]"
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Pilih warna ${color}`}
        />
      ))}
      </div>
      <label className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-[4px] border border-[#D4DEE9] bg-white px-2 py-1 text-[0.68rem] text-[#64748D]">
        Custom
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-[#D4DEE9] bg-transparent p-0"
        />
      </label>
    </div>
  );
}

function CountryPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (country: CountryOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [remoteCountries, setRemoteCountries] = useState<CountryOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const selectedCountry = countryOptions.find(
    (country) => country.code === value,
  ) ?? remoteCountries.find((country) => country.code === value);
  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return countryOptions;
    }

    const localMatches = countryOptions
      .filter(
        (country) =>
          country.name.toLowerCase().includes(normalizedQuery) ||
          country.code.toLowerCase().includes(normalizedQuery) ||
          country.region.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 40);

    const mergedCountries = [...remoteCountries, ...localMatches];
    const seenCodes = new Set<string>();

    return mergedCountries.filter((country) => {
      if (seenCodes.has(country.code)) {
        return false;
      }

      seenCodes.add(country.code);
      return true;
    }).slice(0, 50);
  }, [query, remoteCountries]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setRemoteCountries([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `/api/countries?query=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as CountriesSearchResponse;

        if (response.ok && Array.isArray(payload.countries)) {
          setRemoteCountries(payload.countries);
        }
      } catch {
        if (!controller.signal.aborted) {
          setRemoteCountries([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <details className="group relative">
      <summary className="control-input flex cursor-pointer list-none items-center justify-center p-0 [&::-webkit-details-marker]:hidden">
        <FlagBadge
          code={selectedCountry?.code ?? value}
          label={selectedCountry?.name}
          flagUrl={selectedCountry?.flagSvgUrl ?? selectedCountry?.flagPngUrl}
        />
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-64 rounded-[6px] border border-[#D4DEE9] bg-white p-2 shadow-[0_10px_40px_rgba(6,27,49,0.12)]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari negara..."
          className="control-input mb-2 text-xs"
        />
        <div className="grid max-h-72 gap-1 overflow-y-auto">
          {isSearching ? (
            <p className="px-2 py-2 text-xs text-[#64748D]">
              Mencari negara...
            </p>
          ) : null}
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={(event) => {
                onChange(country);
                setQuery("");
                event.currentTarget
                  .closest("details")
                  ?.removeAttribute("open");
              }}
              className="flex items-center gap-2 rounded-[4px] px-2 py-2 text-left text-xs text-[#061B31] hover:bg-[#F6F9FC]"
            >
              <FlagBadge
                code={country.code}
                label={country.name}
                flagUrl={country.flagSvgUrl ?? country.flagPngUrl}
              />
              <span className="min-w-0 flex-1 truncate">{country.name}</span>
              <span className="text-[0.58rem] text-[#64748D]">
                {country.code}
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

function RumorControls({
  rumorData,
  onRumorChange,
}: {
  rumorData: TransferRumorData;
  onRumorChange: (data: TransferRumorData) => void;
}) {
  const category = getRumorCategory(rumorData.percentage);

  return (
    <Panel title="Rumor Transfer" icon={<BadgePercent className="h-4 w-4" />}>
      <Field label="Cari pemain">
        <input
          list="transfermarkt-player-suggestions"
          value={rumorData.player?.name ?? ""}
          onChange={(event) =>
            onRumorChange({
              ...rumorData,
              player: rumorData.player
                ? { ...rumorData.player, name: event.target.value }
                : {
                    id: "manual-player",
                    name: event.target.value,
                    position: "Unknown",
                  },
            })
          }
          placeholder="Ketik nama pemain..."
          className="control-input"
        />
      </Field>
      <datalist id="transfermarkt-player-suggestions">
        <option value="Marselino Ferdinan" />
        <option value="Sandy Walsh" />
        <option value="Rafael Struick" />
      </datalist>

      <Field label={`Rumor Meter: ${rumorData.percentage}%`}>
        <div className="rounded-[5px] border border-[#D4DEE9] bg-[#F6F9FC] p-3">
          <input
            type="range"
            min={0}
            max={100}
            value={rumorData.percentage}
            onChange={(event) =>
              onRumorChange({
                ...rumorData,
                percentage: Number(event.target.value),
              })
            }
            className="w-full accent-[#533AFD]"
          />
          <div className="mt-2 flex items-start justify-between gap-3 text-xs">
            <span className="text-[#061B31]">{category.label}</span>
            <span className="text-right text-[#64748D]">{category.range}</span>
          </div>
          <p className="mt-1 text-xs text-[#64748D]">
            {category.description}
          </p>
        </div>
      </Field>

      <Field label="Status">
        <select
          value={rumorData.status}
          onChange={(event) =>
            onRumorChange({
              ...rumorData,
              status: event.target.value as RumorStatus,
            })
          }
          className="control-input"
        >
          {rumorStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Klub asal">
          <input
            value={rumorData.fromClub}
            onChange={(event) =>
              onRumorChange({ ...rumorData, fromClub: event.target.value })
            }
            className="control-input"
          />
        </Field>
        <Field label="Klub tujuan">
          <input
            value={rumorData.toClub}
            onChange={(event) =>
              onRumorChange({ ...rumorData, toClub: event.target.value })
            }
            className="control-input"
          />
        </Field>
      </div>
    </Panel>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-edge space-y-3 rounded-[5px] p-3 sm:space-y-4 sm:p-4">
      <div className="studio-label flex items-center gap-2 text-[#273951]">
        <span className="text-[#533AFD]">{icon}</span>
        {title}
      </div>
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 sm:space-y-2">
      <span className="studio-label text-[#64748D]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SaveButton({
  label,
  saving,
  onClick,
}: {
  label: string;
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[#533AFD] px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Plus className="h-4 w-4" />
      {saving ? "Menyimpan..." : label}
    </button>
  );
}

function StatusMessage({
  status,
  message,
}: {
  status: SaveStatus;
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`rounded-[5px] border px-3 py-2 text-xs ${
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {message}
    </p>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable flex min-h-14 flex-col items-center justify-center gap-1 rounded-[4px] px-2 py-2 text-center text-[0.68rem] leading-tight sm:min-h-12 sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-xs ${
        active
          ? "bg-[#533AFD] text-white shadow-[0_10px_28px_rgba(83,58,253,0.18)]"
          : "text-[#64748D] hover:bg-white hover:text-[#533AFD]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function RadioCard({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable min-h-16 rounded-[5px] border p-3 text-left sm:p-4 ${
        active
          ? "border-[#533AFD] bg-[#E8E9FF] text-[#061B31]"
          : "border-[#D4DEE9] bg-white text-[#64748D] hover:border-[#533AFD]"
      }`}
    >
      <span className="block text-lg">{title}</span>
      <span className="text-xs">{subtitle}</span>
    </button>
  );
}

