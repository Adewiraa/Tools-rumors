export interface ClubMaster {
  name: string;
  shortName: string;
  slug: string;
  competitionSlugs?: string[];
  ileagueSlug: string;
  ileagueUrl: string;
  primaryColor: string;
}

const seasonCode = "BRI_SUPER_LEAGUE_2026-27";
const ileagueClubUrl = (slug: string) =>
  `https://ileague.id/clubs/single/${seasonCode}/${slug}`;

export const indonesianClubs: ClubMaster[] = [
  {
    name: "Arema FC",
    shortName: "AREMA",
    slug: "arema-fc",
    ileagueSlug: "AREMA_FC",
    ileagueUrl: ileagueClubUrl("AREMA_FC"),
    primaryColor: "#2563eb",
  },
  {
    name: "Bali United FC",
    shortName: "BALI",
    slug: "bali-united-fc",
    ileagueSlug: "BALI_UNITED_FC",
    ileagueUrl: ileagueClubUrl("BALI_UNITED_FC"),
    primaryColor: "#dc2626",
  },
  {
    name: "Persib Bandung",
    shortName: "PERSIB",
    slug: "persib-bandung",
    ileagueSlug: "PERSIB_BANDUNG",
    ileagueUrl: ileagueClubUrl("PERSIB_BANDUNG"),
    primaryColor: "#2563eb",
  },
  {
    name: "Persija Jakarta",
    shortName: "PERSIJA",
    slug: "persija-jakarta",
    ileagueSlug: "PERSIJA_JAKARTA",
    ileagueUrl: ileagueClubUrl("PERSIJA_JAKARTA"),
    primaryColor: "#dc2626",
  },
  {
    name: "Persebaya Surabaya",
    shortName: "PERSEBAYA",
    slug: "persebaya-surabaya",
    ileagueSlug: "PERSEBAYA_SURABAYA",
    ileagueUrl: ileagueClubUrl("PERSEBAYA_SURABAYA"),
    primaryColor: "#16a34a",
  },
  {
    name: "PSM Makassar",
    shortName: "PSM",
    slug: "psm-makassar",
    ileagueSlug: "PSM_MAKASSAR",
    ileagueUrl: ileagueClubUrl("PSM_MAKASSAR"),
    primaryColor: "#dc2626",
  },
  {
    name: "Borneo FC Samarinda",
    shortName: "BORNEO",
    slug: "borneo-fc-samarinda",
    ileagueSlug: "BORNEO_FC_SAMARINDA",
    ileagueUrl: ileagueClubUrl("BORNEO_FC_SAMARINDA"),
    primaryColor: "#f97316",
  },
  {
    name: "Dewa United FC",
    shortName: "DEWA",
    slug: "dewa-united-fc",
    ileagueSlug: "DEWA_UNITED_FC",
    ileagueUrl: ileagueClubUrl("DEWA_UNITED_FC"),
    primaryColor: "#f59e0b",
  },
  {
    name: "Persis Solo",
    shortName: "PERSIS",
    slug: "persis-solo",
    ileagueSlug: "PERSIS_SOLO",
    ileagueUrl: ileagueClubUrl("PERSIS_SOLO"),
    primaryColor: "#dc2626",
  },
  {
    name: "Madura United FC",
    shortName: "MADURA",
    slug: "madura-united-fc",
    ileagueSlug: "MADURA_UNITED_FC",
    ileagueUrl: ileagueClubUrl("MADURA_UNITED_FC"),
    primaryColor: "#dc2626",
  },
  {
    name: "PSBS Biak",
    shortName: "PSBS",
    slug: "psbs-biak",
    ileagueSlug: "PSBS_BIAK",
    ileagueUrl: ileagueClubUrl("PSBS_BIAK"),
    primaryColor: "#2563eb",
  },
  {
    name: "Persita Tangerang",
    shortName: "PERSITA",
    slug: "persita-tangerang",
    ileagueSlug: "PERSITA_TANGERANG",
    ileagueUrl: ileagueClubUrl("PERSITA_TANGERANG"),
    primaryColor: "#7c3aed",
  },
  {
    name: "Semen Padang FC",
    shortName: "SPFC",
    slug: "semen-padang-fc",
    ileagueSlug: "SEMEN_PADANG_FC",
    ileagueUrl: ileagueClubUrl("SEMEN_PADANG_FC"),
    primaryColor: "#dc2626",
  },
  {
    name: "PSS Sleman",
    shortName: "PSS",
    slug: "pss-sleman",
    ileagueSlug: "PSS_SLEMAN",
    ileagueUrl: ileagueClubUrl("PSS_SLEMAN"),
    primaryColor: "#16a34a",
  },
  {
    name: "Barito Putera",
    shortName: "BARITO",
    slug: "barito-putera",
    ileagueSlug: "BARITO_PUTERA",
    ileagueUrl: ileagueClubUrl("BARITO_PUTERA"),
    primaryColor: "#facc15",
  },
  {
    name: "Persik Kediri",
    shortName: "PERSIK",
    slug: "persik-kediri",
    ileagueSlug: "PERSIK_KEDIRI",
    ileagueUrl: ileagueClubUrl("PERSIK_KEDIRI"),
    primaryColor: "#7c3aed",
  },
  {
    name: "Malut United FC",
    shortName: "MALUT",
    slug: "malut-united-fc",
    ileagueSlug: "MALUT_UNITED_FC",
    ileagueUrl: ileagueClubUrl("MALUT_UNITED_FC"),
    primaryColor: "#f59e0b",
  },
  {
    name: "Bhayangkara Presisi Lampung FC",
    shortName: "BFC",
    slug: "bhayangkara-presisi-lampung-fc",
    ileagueSlug: "BHAYANGKARA_PRESISI_LAMPUNG_FC",
    ileagueUrl: ileagueClubUrl("BHAYANGKARA_PRESISI_LAMPUNG_FC"),
    primaryColor: "#0891b2",
  },
];
