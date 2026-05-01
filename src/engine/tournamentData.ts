// Auto-generated from HLTV — 2026-05-01T08:02:33.010Z
// Run: npx tsx scripts/update-data.ts
export const LAST_UPDATED = '2026-05-01T08:02:33.010Z';

export interface RealTeam {
  id: string; name: string; shortName: string; region: string; rank: number; color: string;
}

export interface RealMatch {
  id: string; teamA: string; teamB: string; winner: string | null; score?: string;
  stage: string; round?: string; matchType: string; played: boolean; date?: string;
}

export interface RealTournament {
  id: string; name: string; fullName: string; icon: string; color: string;
  organizer: string; dates: string; location: string; prize: string; format: string;
  stages: { name: string; desc: string; type: 'gsl' | 'swiss' | 'playoff8' | 'playoff6';
    groups?: { name: string; matches: RealMatch[] }[];
    matches?: RealMatch[]; playoffMatches?: RealMatch[]; }[];
}

const teamData: Record<string, RealTeam> = {
  "vitality": {
    "id": "vitality",
    "name": "Vitality",
    "shortName": "VITA",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "natus-vincere": {
    "id": "natus-vincere",
    "name": "Natus Vincere",
    "shortName": "NATU",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "fut": {
    "id": "fut",
    "name": "FUT",
    "shortName": "FUT",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "astralis": {
    "id": "astralis",
    "name": "Astralis",
    "shortName": "ASTR",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "legacy": {
    "id": "legacy",
    "name": "Legacy",
    "shortName": "LEGA",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "b8": {
    "id": "b8",
    "name": "B8",
    "shortName": "B",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "faze": {
    "id": "faze",
    "name": "FaZe",
    "shortName": "FAZE",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "betboom": {
    "id": "betboom",
    "name": "BetBoom",
    "shortName": "BETB",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "m80": {
    "id": "m80",
    "name": "M80",
    "shortName": "M",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "liquid": {
    "id": "liquid",
    "name": "Liquid",
    "shortName": "LIQU",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "pain": {
    "id": "pain",
    "name": "paiN",
    "shortName": "PAIN",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "nrg": {
    "id": "nrg",
    "name": "NRG",
    "shortName": "NRG",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "gamerlegion": {
    "id": "gamerlegion",
    "name": "GamerLegion",
    "shortName": "GAME",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "sinners": {
    "id": "sinners",
    "name": "SINNERS",
    "shortName": "SINN",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "passion-ua": {
    "id": "passion-ua",
    "name": "Passion UA",
    "shortName": "PASS",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  },
  "bc-game": {
    "id": "bc-game",
    "name": "BC.Game",
    "shortName": "BCG",
    "region": "EU",
    "rank": 99,
    "color": "#3b82f6"
  }
};

const tournamentData: Record<string, { info: RealTournament; teams: RealTeam[] }> = {
  "iem": {
    "info": {
      "id": "iem",
      "name": "IEM Atlanta 2026",
      "fullName": "IEM Atlanta 2026",
      "icon": "🔷",
      "color": "#007AFF",
      "organizer": "",
      "dates": "",
      "location": {
        "name": "Atlanta, GA, US",
        "code": "US"
      },
      "prize": "",
      "format": "",
      "stages": [
        {
          "name": "待公布",
          "desc": "参赛队伍待公布",
          "type": "gsl",
          "groups": []
        }
      ]
    },
    "teams": [
      {
        "id": "vitality",
        "name": "Vitality",
        "shortName": "VITA",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "natus-vincere",
        "name": "Natus Vincere",
        "shortName": "NATU",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "fut",
        "name": "FUT",
        "shortName": "FUT",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "astralis",
        "name": "Astralis",
        "shortName": "ASTR",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "legacy",
        "name": "Legacy",
        "shortName": "LEGA",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "b8",
        "name": "B8",
        "shortName": "B",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "faze",
        "name": "FaZe",
        "shortName": "FAZE",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "betboom",
        "name": "BetBoom",
        "shortName": "BETB",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "m80",
        "name": "M80",
        "shortName": "M",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "liquid",
        "name": "Liquid",
        "shortName": "LIQU",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "pain",
        "name": "paiN",
        "shortName": "PAIN",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "nrg",
        "name": "NRG",
        "shortName": "NRG",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "gamerlegion",
        "name": "GamerLegion",
        "shortName": "GAME",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "sinners",
        "name": "SINNERS",
        "shortName": "SINN",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "passion-ua",
        "name": "Passion UA",
        "shortName": "PASS",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      },
      {
        "id": "bc-game",
        "name": "BC.Game",
        "shortName": "BCG",
        "region": "EU",
        "rank": 99,
        "color": "#3b82f6"
      }
    ]
  }
};

export const tournaments = tournamentData;
