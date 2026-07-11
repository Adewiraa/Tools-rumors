export interface CompetitionMaster {
  slug: string;
  code: string;
  seasonCode: string;
  name: string;
  shortName: string;
  logoUrl: string;
}

export const competitionMasters: CompetitionMaster[] = [
  {
    slug: "super-league",
    code: "BRI_SUPER_LEAGUE",
    seasonCode: "BRI_SUPER_LEAGUE_2025-26",
    name: "Super League",
    shortName: "SL",
    logoUrl: "/competitions/super-league.png",
  },
  {
    slug: "piala-presiden",
    code: "PIALA_PRESIDEN",
    seasonCode: "PIALA_PRESIDEN_2026",
    name: "Piala Presiden",
    shortName: "PP",
    logoUrl: "/competitions/piala-presiden.png",
  },
  {
    slug: "acl-two",
    code: "ACL_TWO",
    seasonCode: "ACL_TWO_2026-27",
    name: "ACL Two",
    shortName: "ACL2",
    logoUrl: "/competitions/acl-two.png",
  },
  {
    slug: "acl-challenge",
    code: "ACL_CHALLENGE",
    seasonCode: "ACL_CHALLENGE_2026-27",
    name: "ACL Challenge",
    shortName: "ACLC",
    logoUrl: "/competitions/acl-challenge.png",
  },
];
