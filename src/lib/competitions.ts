export interface CompetitionMaster {
  slug: string;
  name: string;
  shortName: string;
  logoUrl: string;
}

export const competitionMasters: CompetitionMaster[] = [
  {
    slug: "super-league",
    name: "Super League",
    shortName: "SL",
    logoUrl: "/competitions/super-league.png",
  },
  {
    slug: "piala-presiden",
    name: "Piala Presiden",
    shortName: "PP",
    logoUrl: "/competitions/piala-presiden.png",
  },
  {
    slug: "acl-two",
    name: "ACL Two",
    shortName: "ACL2",
    logoUrl: "/competitions/acl-two.png",
  },
  {
    slug: "acl-challenge",
    name: "ACL Challenge",
    shortName: "ACLC",
    logoUrl: "/competitions/acl-challenge.png",
  },
];
