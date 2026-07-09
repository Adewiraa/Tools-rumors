"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Database,
  Download,
  ImagePlus,
  MapPin,
  Plus,
  Shield,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { FlagBadge } from "@/components/gosball/flag-badge";
import { countryOptions, type CountryOption } from "@/lib/countries";
import { formationOptions } from "@/lib/gosball-fixtures";
import { indonesianClubs } from "@/lib/indonesian-clubs";
import { getRumorCategory } from "@/lib/rumor-categories";
import type {
  CanvasAspectRatio,
  FormationName,
  MatchdayLineupData,
  Player,
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
  logoUrl: string | null;
  city: string | null;
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

const defaultClubForm = {
  name: "",
  shortName: "",
  slug: "",
  city: "",
  ileagueSlug: "",
  ileagueUrl: "",
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
  logoUrl: null,
  city: null,
}));

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
    <aside className="order-2 flex flex-col border-t border-[#D4DEE9] bg-white/92 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:order-1 lg:max-h-screen lg:border-r lg:border-t-0">
      <div className="relative overflow-hidden border-b border-[#D4DEE9] p-4 sm:p-6">
        <div className="absolute -right-14 -top-14 h-36 w-36 rounded-[32px] bg-[linear-gradient(135deg,rgba(83,58,253,0.12),rgba(255,97,24,0.08))]" />
        <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
          <div>
            <p className="studio-label text-[#533AFD]">
              Studio desk
            </p>
            <h1 className="display-type mt-2 text-3xl leading-none tracking-[-0.04em] text-[#061B31]">
              Media Tools
            </h1>
          </div>
          <div className="rounded-[5px] border border-[#D4DEE9] bg-white p-3 text-[#533AFD]">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[6px] border border-[#D4DEE9] bg-[#F6F9FC] p-1">
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

      <div className="flex-1 space-y-5 overflow-visible p-4 sm:space-y-6 sm:p-6 lg:overflow-y-auto">
        {mode !== "master" ? (
          <Panel title="Canvas Ratio" icon={<SlidersHorizontal className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3">
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

      <div className="border-t border-[#D4DEE9] p-6">
        {mode !== "master" ? (
          <button
          type="button"
          onClick={onDownload}
          disabled={isExporting}
          className="pressable flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#533AFD] px-5 py-4 text-sm text-white shadow-[0_14px_32px_rgba(83,58,253,0.20)] disabled:cursor-not-allowed disabled:opacity-70"
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
        <div className="grid grid-cols-2 gap-3">
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
        opponentPlayers={lineupData.awayTeam.starters}
        onTeamChange={updateTeam}
        onFormationChange={onFormationChange}
      />

      <TeamControls
        title="Away Team"
        teamKey="awayTeam"
        team={lineupData.awayTeam}
        clubs={clubs}
        opponentPlayers={lineupData.homeTeam.starters}
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
  opponentPlayers,
  onTeamChange,
  onFormationChange,
}: {
  title: string;
  teamKey: "homeTeam" | "awayTeam";
  team: TeamLineup;
  clubs: ClubOption[];
  opponentPlayers: TeamLineup["starters"];
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

  const updateStarter = (
    index: number,
    field: "name",
    value: string,
  ) => {
    onTeamChange(teamKey, {
      starters: team.starters.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              [field]: value,
            }
          : player,
      ),
    });
  };

  const updateSubstitute = (
    index: number,
    field: "name",
    value: string,
  ) => {
    onTeamChange(teamKey, {
      substitutes: team.substitutes.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              [field]: value,
            }
          : player,
      ),
    });
  };

  const updateStarterCountry = (index: number, country: CountryOption) => {
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

  const suggestionId = `${team.id}-player-suggestions`;

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
    });
  };

  const importSelectedClubRoster = async () => {
    const selectedClub = clubs.find((club) => club.slug === selectedClubSlug);

    if (!selectedClub) {
      setImportStatus("error");
      return;
    }

    try {
      setImportStatus("loading");
      const rosterResponse = await fetch(`/api/clubs/${selectedClub.slug}/roster`);
      const rosterPayload =
        (await rosterResponse.json()) as RosterSearchResponse | { error: string };

      if (
        rosterResponse.ok &&
        !("error" in rosterPayload) &&
        rosterPayload.players.length > 0
      ) {
        const databasePlayers = rosterPayload.players.map(
          (player, index): Player => {
            const existingPlayer =
              team.starters[index] ?? team.substitutes[index - 11];

            return {
              id: player.player_id,
              name: player.display_name ?? player.full_name,
              position: existingPlayer?.position ?? "Unknown",
              shirtNumber: player.shirt_number ?? index + 1,
              nationality: player.country_name ?? player.country_code,
              countryCode: player.country_code,
              countryFlagUrl: player.country_flag_url ?? undefined,
              isForeign: player.country_code !== "ID",
            };
          },
        );

        onTeamChange(teamKey, {
          name: selectedClub.name,
          shortName: selectedClub.shortName,
          primaryColor: selectedClub.primaryColor,
          logoUrl: selectedClub.logoUrl ?? undefined,
          starters: databasePlayers.slice(0, 11).map((player, index) => ({
            ...player,
            position: team.starters[index]?.position ?? player.position,
          })),
          substitutes: databasePlayers.slice(11, 21).map((player, index) => ({
            ...player,
            position: team.substitutes[index]?.position ?? player.position,
          })),
        });
        setRosterSuggestions(databasePlayers);
        setImportStatus("success");
        return;
      }

      if (!selectedClub.ileagueUrl) {
        onTeamChange(teamKey, {
          name: selectedClub.name,
          shortName: selectedClub.shortName,
          primaryColor: selectedClub.primaryColor,
          logoUrl: selectedClub.logoUrl ?? undefined,
        });
        setImportStatus("error");
        return;
      }

      const response = await fetch(
        `/api/ileague/club?url=${encodeURIComponent(selectedClub.ileagueUrl)}`,
      );
      const payload = (await response.json()) as
        | ILeagueImportResponse
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Import gagal");
      }

      if (payload.players.length === 0) {
        onTeamChange(teamKey, {
          name: selectedClub.name,
          shortName: selectedClub.shortName,
          primaryColor: selectedClub.primaryColor,
          logoUrl: selectedClub.logoUrl ?? undefined,
        });
        setImportStatus("error");
        return;
      }

      const importedPlayers = payload.players.map((player, index): Player => {
        const existingPlayer = team.starters[index] ?? team.substitutes[index - 11];

        return {
          id: player.id,
          name: player.name,
          position: existingPlayer?.position ?? "Unknown",
          shirtNumber: player.shirtNumber,
          nationality: player.nationality,
          countryCode: player.countryCode,
          isForeign: player.countryCode !== "ID",
        };
      });
      setRosterSuggestions(importedPlayers);

      onTeamChange(teamKey, {
        name: payload.teamName || selectedClub.name,
        shortName: payload.shortName || selectedClub.shortName,
        primaryColor: selectedClub.primaryColor,
        logoUrl: selectedClub.logoUrl ?? undefined,
        starters: importedPlayers.slice(0, 11).map((player, index) => ({
          ...player,
          position: team.starters[index]?.position ?? player.position,
        })),
        substitutes: importedPlayers.slice(11, 21).map((player, index) => ({
          ...player,
          position: team.substitutes[index]?.position ?? player.position,
        })),
        coach: {
          ...team.coach,
          name: payload.coachName,
        },
      });
      setImportStatus("success");
    } catch {
      setImportStatus("error");
    }
  };

  const findRosterPlayerByName = (name: string) => {
    const normalizedName = name.trim().toLowerCase();

    return rosterSuggestions.find(
      (player) => player.name.trim().toLowerCase() === normalizedName,
    );
  };

  const applyRosterPlayerToStarter = (index: number, name: string) => {
    const rosterPlayer = findRosterPlayerByName(name);

    if (!rosterPlayer) {
      return;
    }

    onTeamChange(teamKey, {
      starters: team.starters.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              ...rosterPlayer,
              position: player.position,
            }
          : player,
      ),
    });
  };

  const applyRosterPlayerToSubstitute = (index: number, name: string) => {
    const rosterPlayer = findRosterPlayerByName(name);

    if (!rosterPlayer) {
      return;
    }

    onTeamChange(teamKey, {
      substitutes: team.substitutes.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              ...rosterPlayer,
              position: player.position,
            }
          : player,
      ),
    });
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
            onClick={importSelectedClubRoster}
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama klub">
          <input
            value={team.name}
            onChange={(event) => onTeamChange(teamKey, { name: event.target.value })}
            className="control-input"
          />
        </Field>
        <Field label="Short name">
          <input
            value={team.shortName}
            onChange={(event) =>
              onTeamChange(teamKey, { shortName: event.target.value })
            }
            className="control-input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <Field label="Warna klub">
          <ColorPresetPicker
            value={team.primaryColor}
            onChange={(primaryColor) => onTeamChange(teamKey, { primaryColor })}
          />
        </Field>
      </div>

      <Field label="Pelatih">
        <input
          value={team.coach.name}
          onChange={(event) =>
            onTeamChange(teamKey, {
              coach: { ...team.coach, name: event.target.value },
            })
          }
          className="control-input"
        />
      </Field>

      <div className="space-y-3">
        <p className="text-xs text-[#533AFD]">
          Starting XI
        </p>
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {team.starters.map((player, index) => (
            <div key={player.id} className="grid grid-cols-[1fr_3rem] gap-2">
              <Field label={`${index + 1}. ${player.position}`}>
                <input
                  list={suggestionId}
                  value={player.name}
                  onChange={(event) =>
                    updateStarter(index, "name", event.target.value)
                  }
                  onBlur={(event) =>
                    applyRosterPlayerToStarter(index, event.target.value)
                  }
                  className="control-input"
                />
              </Field>
              <Field label="Flag">
                <CountryPicker
                  value={player.countryCode}
                  onChange={(country) => updateStarterCountry(index, country)}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-[#533AFD]">
          Cadangan
        </p>
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {team.substitutes.map((player, index) => (
            <div key={player.id} className="grid grid-cols-[1fr_3rem] gap-2">
              <Field label={`Sub ${index + 1}`}>
                <input
                  list={suggestionId}
                  value={player.name}
                  onChange={(event) =>
                    updateSubstitute(index, "name", event.target.value)
                  }
                  onBlur={(event) =>
                    applyRosterPlayerToSubstitute(index, event.target.value)
                  }
                  className="control-input"
                />
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

      <datalist id={suggestionId}>
        {[
          ...rosterSuggestions,
          ...team.starters,
          ...team.substitutes,
          ...opponentPlayers,
        ].map((player, index) => (
          <option
            key={`${team.id}-${player.id}-${index}`}
            value={player.name}
          />
        ))}
      </datalist>
    </Panel>
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
      logoPublicUrl: club.logoUrl ?? "",
      primaryColor: club.primaryColor,
    }));
  };

  const resetClubForm = () => {
    setClubForm(defaultClubForm);
    setClubStatus("idle");
    setClubMessage("");
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
      <div className="grid grid-cols-2 gap-2 rounded-[6px] border border-[#D4DEE9] bg-[#F6F9FC] p-1">
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

        <div className="grid grid-cols-2 gap-3">
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

        <div className="grid grid-cols-2 gap-3">
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

        <Field label="Logo public URL">
          <input
            value={clubForm.logoPublicUrl}
            onChange={(event) =>
              setClubForm((current) => ({
                ...current,
                logoPublicUrl: event.target.value,
              }))
            }
            placeholder="https://..."
            className="control-input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
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

        <div className="grid grid-cols-2 gap-3">
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

        <div className="grid grid-cols-3 gap-3">
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

        <div className="grid grid-cols-2 gap-3">
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
              <span
                className="h-8 w-8 rounded-[5px] border border-[#D4DEE9]"
                style={{ backgroundColor: club.primaryColor }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm text-[#061B31]">
                  {club.name}
                </span>
                <span className="block truncate text-[0.68rem] text-[#64748D]">
                  {club.shortName} {club.city ? `/ ${club.city}` : ""}
                </span>
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

      <div className="grid grid-cols-2 gap-3">
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
    <section className="glass-edge space-y-4 rounded-[5px] p-4">
      <div className="studio-label flex items-center gap-2 text-[#273951]">
        <span className="text-[#533AFD]">{icon}</span>
        {title}
      </div>
      <div className="space-y-4">{children}</div>
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
    <label className="block space-y-2">
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
      className="pressable flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#533AFD] px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
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
      className={`pressable flex items-center justify-center gap-2 rounded-[4px] px-3 py-3 text-xs ${
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
      className={`pressable rounded-[5px] border p-4 text-left ${
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
