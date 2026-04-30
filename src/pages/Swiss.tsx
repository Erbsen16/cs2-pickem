import { useMemo } from 'react';
import { generateSwissStage } from '../engine/swiss';
import { teams, getTeam } from '../engine/teams';
import type { SwissStage, Match } from '../engine/types';
import RulePanel, { Tip, Badge } from '../components/RulePanel';

export default function Swiss() {
  const stage = useMemo(() => {
    const sixteen = [...teams].sort((a, b) => a.seed - b.seed).slice(0, 16);
    return generateSwissStage(sixteen, 'swiss1', 42, true);
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 72px' }} className="page-enter">
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.8, marginBottom: 6, color: '#1d1d1f' }}>
          瑞士轮
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 440, maxWidth: 560 }}>
          Swiss System — 16 队，同战绩互打。3 胜晋级，3 败淘汰，最多 5 轮。
        </p>
      </div>

      <SwissCompactView stage={stage} />

      <div style={{ marginTop: 48, maxWidth: 640, margin: '48px auto 0' }}>
        <RulePanel title="规则要点" icon="📖">
          <h4 style={{ color: '#1d1d1f', marginTop: 8, marginBottom: 4, fontSize: 13, fontWeight: 640 }}>基本规则</h4>
          <ul style={{ paddingLeft: 16, marginBottom: 8, fontSize: 13 }}>
            <li>赢 3 场 = <Badge variant="win">晋级</Badge> · 输 3 场 = <Badge variant="loss">淘汰</Badge></li>
            <li>同战绩互打：1-0 打 1-0，2-1 打 2-1</li>
            <li>第 1 轮种子配对，之后同战绩随机抽签</li>
          </ul>
          <Tip>
            新手理解：瑞士轮就像"按分数分班考试"——考同样分数的人下次在同一个考场。越到后面对手越强。
          </Tip>
        </RulePanel>
      </div>
    </div>
  );
}

function SwissCompactView({ stage }: { stage: SwissStage }) {
  const teamPreRecord = new Map<string, Map<number, string>>();
  for (const rec of stage.records) teamPreRecord.set(rec.teamId, new Map([[0, '0-0']]));
  const current = new Map<string, { w: number; l: number }>();
  for (const r of stage.records) current.set(r.teamId, { w: 0, l: 0 });

  for (let r = 1; r <= 5; r++) {
    for (const m of stage.matches.filter(m => m.round === r)) {
      if (m.winner === m.teamA) { current.get(m.teamA)!.w++; current.get(m.teamB)!.l++; }
      else if (m.winner === m.teamB) { current.get(m.teamB)!.w++; current.get(m.teamA)!.l++; }
    }
    for (const [tid, rec] of current) teamPreRecord.get(tid)!.set(r, `${rec.w}-${rec.l}`);
  }

  const roundData: { round: number; groups: { record: string; matches: Match[] }[] }[] = [];
  for (let r = 1; r <= 5; r++) {
    const rMatches = stage.matches.filter(m => m.round === r);
    if (rMatches.length === 0) continue;
    const groups = new Map<string, Match[]>();
    for (const m of rMatches) {
      const preRec = teamPreRecord.get(m.teamA)!.get(r - 1) || '0-0';
      if (!groups.has(preRec)) groups.set(preRec, []);
      groups.get(preRec)!.push(m);
    }
    roundData.push({
      round: r,
      groups: Array.from(groups.entries())
        .sort(([a], [b]) => { const wa = parseInt(a), la = parseInt(a.split('-')[1]), wb = parseInt(b), lb = parseInt(b.split('-')[1]); return wb - wa || la - lb; })
        .map(([record, matches]) => ({ record, matches })),
    });
  }

  // Show as sticky columns: 260px wide, compact match cards
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 14, minWidth: roundData.length * 250 }}>
        {roundData.map(({ round, groups }) => (
          <div key={round} style={{
            flex: '0 0 250px',
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1.5px solid var(--accent)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>第 {round} 轮</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                {groups.reduce((s, g) => s + g.matches.length, 0)} 场
              </div>
            </div>
            <div style={{ padding: '10px 10px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groups.map(({ record, matches }) => {
                const w = parseInt(record);
                const l = parseInt(record.split('-')[1]);
                return (
                  <div key={record}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                        background: w === 2 ? 'rgba(52,199,89,0.12)' : l === 2 ? 'rgba(255,59,48,0.1)' : 'rgba(0,122,255,0.07)',
                        color: w === 2 ? 'var(--win)' : l === 2 ? 'var(--loss)' : 'var(--accent)',
                      }}>
                        {record} {w === 2 ? '· 晋级' : l === 2 ? '· 淘汰' : ''}
                      </span>
                    </div>
                    {matches.map(m => <MiniMatch key={m.id} match={m} record={record} />)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniMatch({ match, record }: { match: Match; record: string }) {
  const tA = getTeam(match.teamA);
  const tB = getTeam(match.teamB);
  const aWon = match.winner === tA.id;
  const bWon = match.winner === tB.id;
  const w = parseInt(record);
  const l = parseInt(record.split('-')[1]);
  const isAdvMatch = w === 2;
  const isElimMatch = l === 2;

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', fontWeight: aWon ? 600 : 400, color: aWon ? '#1d1d1f' : 'var(--text-secondary)', fontSize: 12, background: (aWon && isAdvMatch) ? 'rgba(52,199,89,0.10)' : (!aWon && isElimMatch) ? 'rgba(255,59,48,0.08)' : 'transparent', transition: 'background 0.2s' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(145deg, ${tA.color}, ${tA.secondaryColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{tA.shortName}</div>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tA.name}</span>
        {aWon && isAdvMatch && <span style={{ color: 'var(--win)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>晋级</span>}
        {!aWon && isElimMatch && <span style={{ color: 'var(--loss)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>淘汰</span>}
        {aWon && !isAdvMatch && <span style={{ color: 'var(--win)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>W</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '2px 9px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 9, color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.03)', padding: '1px 6px', borderRadius: 4 }}>{match.matchType.toUpperCase()}</span>
        {isAdvMatch && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--win)', background: 'rgba(52,199,89,0.08)', padding: '1px 6px', borderRadius: 4 }}>晋级赛</span>}
        {isElimMatch && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--loss)', background: 'rgba(255,59,48,0.08)', padding: '1px 6px', borderRadius: 4 }}>淘汰赛</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', fontWeight: bWon ? 600 : 400, color: bWon ? '#1d1d1f' : 'var(--text-secondary)', fontSize: 12, background: (bWon && isAdvMatch) ? 'rgba(52,199,89,0.10)' : (!bWon && isElimMatch) ? 'rgba(255,59,48,0.08)' : 'transparent', transition: 'background 0.2s' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(145deg, ${tB.color}, ${tB.secondaryColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{tB.shortName}</div>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tB.name}</span>
        {bWon && isAdvMatch && <span style={{ color: 'var(--win)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>晋级</span>}
        {!bWon && isElimMatch && <span style={{ color: 'var(--loss)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>淘汰</span>}
        {bWon && !isAdvMatch && <span style={{ color: 'var(--win)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>W</span>}
      </div>
    </div>
  );
}
