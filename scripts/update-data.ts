/**
 * Fetch real CS2 tournament data from HLTV and generate tournamentData.ts
 * Run: npx tsx scripts/update-data.ts
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { HLTV } = require('hltv');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT = path.join(__dirname, '..', 'src', 'engine', 'tournamentData.ts');

// Tournament configs we care about (HLTV event names)
const TRACKED_TOURNAMENTS = [
  { id: 'blast', name: 'BLAST Rivals Spring 2026', color: '#5856D6', icon: '⚡' },
  { id: 'cac', name: 'CAC 2026', color: '#e53935', icon: '🌏' },
  { id: 'major', name: 'IEM Cologne 2026', color: '#f0a500', icon: '🏆' },
  { id: 'iem', name: 'IEM Atlanta 2026', color: '#007AFF', icon: '🔷' },
];

interface SimpleTeam {
  id: string;
  name: string;
  shortName: string;
  region: string;
  rank: number;
  color: string;
}

interface SimpleMatch {
  id: string;
  teamA: string;
  teamB: string;
  winner: string | null;
  score: string | null;
  stage: string;
  matchType: string;
  played: boolean;
  date: string | null;
  round: string;
}

const REGION_COLORS: Record<string, string> = {
  EU: '#3b82f6', NA: '#ef4444', SA: '#22c55e',
  ASIA: '#f59e0b', OCE: '#8b5cf6', INT: '#6b7280',
};

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
}

async function fetchTeamRanking(): Promise<Map<string, { rank: number; region: string }>> {
  try {
    const rankings = await HLTV.getTeamRanking();
    const map = new Map<string, { rank: number; region: string }>();
    rankings.forEach((t: any, i: number) => {
      map.set(t.team.name.toLowerCase(), { rank: i + 1, region: t.team.region || 'EU' });
    });
    console.log(`  Fetched ${map.size} team rankings`);
    return map;
  } catch (e) {
    console.error('  Failed to fetch rankings:', (e as Error).message);
    return new Map();
  }
}

async function main() {
  console.log('Fetching CS2 tournament data from HLTV...\n');

  // Get team rankings
  const rankings = await fetchTeamRanking();

  // Get all events
  let events: any[] = [];
  try {
    const upcoming = await HLTV.getEvents();
    events = upcoming || [];
    console.log(`  Fetched ${events.length} upcoming/ongoing events`);
  } catch (e) {
    console.error('  Failed to fetch events:', (e as Error).message);
  }

  const tournamentData: any[] = [];

  for (const cfg of TRACKED_TOURNAMENTS) {
    console.log(`\nProcessing: ${cfg.name}...`);

    // Find matching event
    const event = events.find((e: any) =>
      e.name?.toLowerCase().includes(cfg.name.toLowerCase()) ||
      cfg.name.toLowerCase().includes(e.name?.toLowerCase())
    );

    if (!event) {
      console.log(`  Not found on HLTV — keeping existing data`);
      continue;
    }

    console.log(`  Found event: ${event.name} (ID: ${event.id})`);

    // Get event details with matches
    let eventDetail: any = null;
    try {
      eventDetail = await HLTV.getEvent({ id: event.id });
    } catch (e) {
      console.error(`  Failed to get event detail:`, (e as Error).message);
    }

    // Extract teams
    const teams: SimpleTeam[] = (eventDetail?.teams || event.teams || []).map((t: any) => {
      const name = t.name || t.team?.name || '';
      const rankInfo = rankings.get(name.toLowerCase());
      return {
        id: slug(name),
        name,
        shortName: name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, ''),
        region: rankInfo?.region || t.region || 'EU',
        rank: rankInfo?.rank || t.rank || 99,
        color: REGION_COLORS[rankInfo?.region || 'EU'] || '#6b7280',
      };
    });

    // Extract matches
    const matches: SimpleMatch[] = (eventDetail?.matches || []).map((m: any, i: number) => ({
      id: `${cfg.id}-m${i + 1}`,
      teamA: slug(m.team1?.name || m.leftTeam?.name || ''),
      teamB: slug(m.team2?.name || m.rightTeam?.name || ''),
      winner: m.winner ? slug(m.winner?.name || '') : null,
      score: m.result || m.score || null,
      stage: m.stage || 'group',
      matchType: m.format || 'BO3',
      played: !!m.result,
      date: m.date || null,
      round: m.title || '',
    }));

    // Build stages from match data
    const groupMatches = matches.filter(m => m.stage === 'group' || m.stage.includes('group'));
    const playoffMatches = matches.filter(m => m.stage === 'playoff' || m.stage.includes('playoff'));

    const stages: any[] = [];
    if (groupMatches.length > 0) {
      // Split into groups
      const half = Math.ceil(groupMatches.length / 2);
      stages.push({
        name: '小组赛',
        desc: `${teams.length} 支队伍参赛`,
        type: 'gsl',
        groups: [
          { name: 'A 组', matches: groupMatches.slice(0, half) },
          ...(half < groupMatches.length ? [{ name: 'B 组', matches: groupMatches.slice(half) }] : []),
        ],
      });
    }
    if (playoffMatches.length > 0) {
      stages.push({
        name: '季后赛',
        desc: '单败淘汰',
        type: 'playoff8',
        playoffMatches,
      });
    }

    if (stages.length === 0) {
      stages.push({
        name: eventDetail?.prize ? '进行中' : '待公布',
        desc: eventDetail?.prize || '参赛队伍待公布',
        type: 'gsl',
        groups: [],
      });
    }

    tournamentData.push({
      id: cfg.id,
      info: {
        id: cfg.id,
        name: cfg.id === 'major' ? 'Major' : cfg.id === 'cac' ? 'CAC 2026' : event.name || cfg.name,
        fullName: event.name || cfg.name,
        icon: cfg.icon,
        color: cfg.color,
        organizer: event.organizer || '',
        dates: event.dateRange || '',
        location: event.location || '',
        prize: event.prize || '',
        format: event.format || '',
        stages,
      },
      teams,
    });
  }

  // Generate output
  const output = generateOutput(tournamentData);
  fs.writeFileSync(OUTPUT, output, 'utf-8');
  console.log(`\n✅ Written to ${OUTPUT}`);
}

function generateOutput(tournaments: any[]): string {
  const teamMap = new Map<string, any>();
  for (const t of tournaments) {
    for (const team of t.teams) {
      if (!teamMap.has(team.id)) teamMap.set(team.id, team);
    }
  }

  const teamsCode = JSON.stringify(
    Object.fromEntries(Array.from(teamMap.entries()).map(([id, t]) => [id, t])),
    null, 2
  );

  const tournamentsCode = JSON.stringify(
    Object.fromEntries(tournaments.map(t => [t.id, { info: t.info, teams: t.teams }])),
    null, 2
  );

  return `// Auto-generated from HLTV — ${new Date().toISOString()}
// Run: npx tsx scripts/update-data.ts
export const LAST_UPDATED = '${new Date().toISOString()}';

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

const teamData: Record<string, RealTeam> = ${teamsCode};

const tournamentData: Record<string, { info: RealTournament; teams: RealTeam[] }> = ${tournamentsCode};

export const tournaments = tournamentData;
`.trimStart();
}

main().catch(console.error);
