import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournaments, type RealTeam, type RealMatch, LAST_UPDATED } from '../engine/tournamentData';

const tc = new Map<string, RealTeam>();
Object.values(tournaments).forEach(({ teams }) => teams.forEach(t => tc.set(t.id, t)));
const gt = (id: string): RealTeam => tc.get(id) || { id, name: id, shortName: id.slice(0, 3).toUpperCase(), region: '?', rank: 99, color: '#888' };

export default function PickemTournament() {
  const { id } = useParams<{ id: string }>();
  const data = tournaments[id || 'major'];
  if (!data) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>数据加载中...</div>;

  const { info, teams } = data;
  const [stageIdx, setStageIdx] = useState(0);
  const stage = info.stages[stageIdx];
  const hasTeams = teams.length > 0;
  const allMatches = (stage.groups || []).flatMap(g => g.matches);
  const hasResults = allMatches.some(m => m.played);

  const [slots, setSlots] = useState<Record<string, string>>({});
  const dragId = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);
  const usedIds = new Set(Object.values(slots).filter(Boolean));

  const groups = useMemo(() => {
    if (allMatches.length > 0) return (stage?.groups || []);
    if (!hasTeams || !stage?.groups) return stage?.groups || [];
    const pref = info.id;
    return (stage?.groups || []).map((g, gi) => {
      const half = Math.ceil(teams.length / (stage?.groups?.length || 1));
      const gp = teams.slice(gi * half, (gi + 1) * half);
      const n = Math.floor(gp.length / 2);
      const ms: { id: string; phase: string }[] = [];
      for (let i = 0; i < n; i++) ms.push({ id: `${pref}-g${gi}-r1-${i}`, phase: 'r1' });
      for (let i = 0; i < n / 2; i++) ms.push({ id: `${pref}-g${gi}-up-${i}`, phase: 'up' });
      ms.push({ id: `${pref}-g${gi}-upFinal`, phase: 'upFinal' });
      ms.push({ id: `${pref}-g${gi}-lo-0`, phase: 'lo' });
      ms.push({ id: `${pref}-g${gi}-lo-1`, phase: 'lo' });
      ms.push({ id: `${pref}-g${gi}-loFinal`, phase: 'loFinal' });
      return { name: g.name, matches: ms };
    });
  }, [allMatches.length, hasTeams, info.stages, info.id, teams]);

  const startDrag = useCallback((tid: string) => { dragId.current = tid; setDragging(tid); }, []);
  const endDrag = useCallback(() => { dragId.current = null; setDragging(null); setHovering(null); }, []);

  const handleDrop = useCallback((slotId: string) => {
    const tid = dragId.current;
    if (!tid) return;
    setSlots(prev => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) if (v !== tid) next[k] = v;
      next[slotId] = tid;
      return next;
    });
    endDrag();
  }, [endDrag]);

  // Clear: remove team from ALL slots (R1 + all downstream cascades)
  const handleClear = useCallback((slotId: string) => {
    setSlots(prev => {
      const tid = prev[slotId];
      if (!tid) return prev;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) if (v !== tid) next[k] = v;
      return next;
    });
  }, []);

  // Swap: invert a/b in the R1 match that sourced this downstream team
  const handleSwap = useCallback((slotId: string) => {
    if (!groups) return;
    setSlots(prev => {
      const next = { ...prev };
      for (const g of groups) {
        const ms = (g as any).matches as { id: string; phase: string }[];
        const r1 = ms.filter((m: any) => m.phase === 'r1');
        for (const m of r1) {
          const aKey = `${m.id}-a`, bKey = `${m.id}-b`;
          const teamInSlot = next[slotId];
          // If this slot holds a team from any R1 slot (a or b), swap that match
          if (teamInSlot && (teamInSlot === next[aKey] || teamInSlot === next[bKey])) {
            [next[aKey], next[bKey]] = [next[bKey], next[aKey]];
            // Clear all non-R1 slots to trigger re-propagation
            for (const m2 of ms) {
              if (m2.phase !== 'r1') { delete next[`${m2.id}-a`]; delete next[`${m2.id}-b`]; }
            }
            return next;
          }
        }
      }
      return next;
    });
  }, [groups]);

  // Auto-propagate
  useEffect(() => {
    if (!groups || hasResults) return;
    const next = { ...slots };
    let changed = false;
    const sif = (k: string, v: string) => { if (v && !next[k]) { next[k] = v; changed = true; } };
    for (const g of groups) {
      const ms = (g as any).matches as { id: string; phase: string }[];
      const r1 = ms.filter((m: any) => m.phase === 'r1');
      const up = ms.filter((m: any) => m.phase === 'up');
      const upF = ms.find((m: any) => m.phase === 'upFinal');
      const lo = ms.filter((m: any) => m.phase === 'lo');
      const loF = ms.find((m: any) => m.phase === 'loFinal');
      r1.forEach((m, i) => {
        const w = slots[`${m.id}-a`], l = slots[`${m.id}-b`];
        if (w && l) {
          if (i < 2 && up[0]) { sif(`${up[0].id}-${i === 0 ? 'a' : 'b'}`, w); }
          if (i >= 2 && up[1]) { sif(`${up[1].id}-${i === 2 ? 'a' : 'b'}`, w); }
          if (i < 2 && lo[0]) { sif(`${lo[0].id}-${i === 0 ? 'a' : 'b'}`, l); }
          if (i >= 2 && lo[1]) { sif(`${lo[1].id}-${i === 2 ? 'a' : 'b'}`, l); }
        }
      });
      up.forEach((m, i) => {
        const w = slots[`${m.id}-a`], l = slots[`${m.id}-b`];
        if (w && l && upF) { sif(`${upF.id}-${i === 0 ? 'a' : 'b'}`, w); sif(`${upF.id}-b`, l); }
      });
      lo.forEach((m, i) => { if (loF) sif(`${loF.id}-${i === 0 ? 'a' : 'b'}`, slots[`${m.id}-a`]); });
      if (upF) { const ul = slots[`${upF.id}-b`]; if (loF && ul) sif(`${loF.id}-b`, ul); }
    }
    if (changed) setSlots(next);
  }, [slots, groups, hasResults]);

  useEffect(() => { setSlots({}); }, [id]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 72px' }} className="page-enter">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>← 返回首页</Link>
        <div style={{ fontSize: 32, marginTop: 6 }}>{info.icon}</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', marginTop: 4 }}>{info.fullName}</h1>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{info.dates} · {info.location} · {info.prize} · {info.format}</div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
          数据更新于 {new Date(LAST_UPDATED).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        {info.stages.length > 1 && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 16 }}>
            {info.stages.map((s, i) => (
              <button key={i} onClick={() => setStageIdx(i)} style={{
                padding: '6px 18px', borderRadius: 8,
                border: i === stageIdx ? `1.5px solid ${info.color}` : '1px solid var(--border)',
                background: i === stageIdx ? `${info.color}10` : 'white',
                fontSize: 12, fontWeight: i === stageIdx ? 600 : 420,
                color: i === stageIdx ? '#1d1d1f' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{s.name}</button>
            ))}
          </div>
        )}
      </div>

      {hasTeams && !hasResults && (
        <div style={{ position: 'sticky', top: 8, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 16px', marginBottom: 24, boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', flexShrink: 0 }}>队伍池</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {teams.filter(t => !usedIds.has(t.id)).map(t => (
              <div key={t.id} draggable onDragStart={() => startDrag(t.id)} onDragEnd={endDrag}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 4px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, cursor: 'grab', opacity: dragging === t.id ? 0.4 : 1, userSelect: 'none' }}>
                <Badge team={t} size={22} />
                <span style={{ fontSize: 12, fontWeight: 540 }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
        <h3 style={{ fontSize: 16, fontWeight: 640, marginBottom: 4, color: '#1d1d1f' }}>{stage?.name || '小组赛'}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{stage?.desc || ''}</p>
        {!hasTeams && <div style={{ textAlign: 'center', padding: 48 }}><div style={{ fontSize: 48 }}>📋</div><div style={{ fontSize: 16, fontWeight: 600, marginTop: 12, color: 'var(--text-secondary)' }}>参赛队伍名单即将公布</div></div>}
        {hasTeams && hasResults && <GSLViewer groups={(stage?.groups || []).map(g => ({ name: g.name, matches: g.matches as RealMatch[] }))} />}
        {hasTeams && !hasResults && (stage?.groups?.length || 0) > 0 && groups && <Bracket groups={groups as any} slots={slots} hovering={hovering} onDrop={handleDrop} onClear={handleClear} onSwap={handleSwap} onHover={setHovering} onDragTeam={startDrag} />}
        {hasTeams && !hasResults && (stage?.groups?.length || 0) === 0 && <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-tertiary)' }}><div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div><div style={{ fontSize: 15, fontWeight: 600 }}>待小组赛结束后确定</div></div>}
      </div>
    </div>
  );
}

/* ── Clean Bracket ── */

function Bracket({ groups, slots, hovering, onDrop, onClear, onSwap, onHover, onDragTeam }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {groups.map((g: any) => {
        const ms = g.matches as { id: string; phase: string }[];
        const r1 = ms.filter((m: any) => m.phase === 'r1');
        const up = ms.filter((m: any) => m.phase === 'up');
        const upF = ms.find((m: any) => m.phase === 'upFinal');
        const lo = ms.filter((m: any) => m.phase === 'lo');
        const loF = ms.find((m: any) => m.phase === 'loFinal');
        return <BracketGroup key={g.name} groupName={g.name} r1={r1} up={up} upF={upF} lo={lo} loF={loF} slots={slots} hovering={hovering} onDrop={onDrop} onClear={onClear} onSwap={onSwap} onHover={onHover} onDragTeam={onDragTeam} />;
      })}
    </div>
  );
}

function BracketGroup({ groupName, r1, up, upF, lo, loF, slots, hovering, onDrop, onClear, onSwap, onHover, onDragTeam }: any) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, overflowX: 'auto' }}>
      <h4 style={{ fontSize: 15, fontWeight: 640, marginBottom: 20, color: '#1d1d1f' }}>{groupName}</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 780, justifyContent: 'center' }}>
        <Col3 label="首轮 BO1" accent>
          {r1.map((m: any, i: number) => <div key={m.id} style={{ marginBottom: i < r1.length - 1 ? 14 : 0 }}><MatchCard mid={m.id} slots={slots} r1 hovering={hovering} onDrop={onDrop} onClear={onClear} onHover={onHover} onDragTeam={onDragTeam} /></div>)}
        </Col3>
        <span style={{ fontSize: 20, color: 'var(--text-tertiary)', flexShrink: 0 }}>→</span>
        <Col3 label="胜者组" accent>
          {up.map((m: any) => <div key={m.id} style={{ marginBottom: 28 }}><MatchCard mid={m.id} slots={slots} onClick={onSwap} /></div>)}
        </Col3>
        <span style={{ fontSize: 20, color: 'var(--text-tertiary)', flexShrink: 0 }}>→</span>
        <Col3 label="决赛" accent>
          {upF && <div style={{ marginTop: 24 }}><MatchCard mid={upF.id} slots={slots} onClick={onSwap} /><div style={{ marginTop: 8, fontSize: 11, color: 'var(--win)', fontWeight: 600, textAlign: 'center' }}>胜=第1 · 负=第2</div></div>}
        </Col3>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)', flexShrink: 0, margin: '0 12px' }} />
        <Col3 label="败者组" loss>
          {lo.map((m: any) => <div key={m.id} style={{ marginBottom: 28 }}><MatchCard mid={m.id} slots={slots} onClick={onSwap} /></div>)}
        </Col3>
        <span style={{ fontSize: 20, color: 'var(--text-tertiary)', flexShrink: 0 }}>→</span>
        <Col3 label="决赛" loss>
          {loF && <div style={{ marginTop: 24 }}><MatchCard mid={loF.id} slots={slots} onClick={onSwap} /><div style={{ marginTop: 8, fontSize: 11, color: 'var(--loss)', fontWeight: 600, textAlign: 'center' }}>胜=第3 · 负淘汰</div></div>}
        </Col3>
      </div>
    </div>
  );
}

function Col3({ label, accent, loss, children }: { label: string; accent?: boolean; loss?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ flex: '0 0 auto', minWidth: 148 }}>
      <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 14, padding: '4px 0', borderBottom: accent ? '2px solid rgba(0,122,255,0.2)' : loss ? '2px solid rgba(255,59,48,0.15)' : '1px solid var(--border)', color: accent ? 'var(--accent)' : loss ? 'var(--loss)' : 'var(--text-secondary)' }}>{label}</div>
      {children}
    </div>
  );
}

function MatchCard({ mid, slots, r1, onClick, hovering, onDrop, onClear, onHover, onDragTeam }: any) {
  const teamA = slots[`${mid}-a`] ? gt(slots[`${mid}-a`]) : null;
  const teamB = slots[`${mid}-b`] ? gt(slots[`${mid}-b`]) : null;
  return (
    <div data-mid={mid} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', width: 148, boxShadow: 'var(--shadow-sm)' }}>
      <Slot3 slotId={`${mid}-a`} team={teamA} isR1={r1} hovering={hovering} onDrop={onDrop} onClear={onClear} onClick={onClick} onHover={onHover} onDragTeam={onDragTeam} />
      <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', padding: '2px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>VS</div>
      <Slot3 slotId={`${mid}-b`} team={teamB} isR1={r1} hovering={hovering} onDrop={onDrop} onClear={onClear} onClick={onClick} onHover={onHover} onDragTeam={onDragTeam} />
    </div>
  );
}

function Slot3({ slotId, team, isR1, hovering, onDrop, onClear, onClick, onHover, onDragTeam }: any) {
  const hov = hovering === slotId;
  return (
    <div
      onClick={() => {
        if (!team) return;
        if (isR1) onClear(slotId);
        else onClick(slotId);
      }}
      onDragOver={(e: any) => { if (isR1) { e.preventDefault(); onHover(slotId); } }}
      onDragLeave={() => { if (isR1) onHover(null); }}
      onDrop={(e: any) => { if (isR1) { e.preventDefault(); onDrop(slotId); } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
        minHeight: 36, cursor: team ? 'pointer' : (isR1 ? 'default' : 'default'),
        background: hov && isR1 ? 'rgba(0,122,255,0.06)' : 'transparent',
        outline: hov && isR1 ? '2px dashed var(--accent)' : 'none', outlineOffset: -2,
        transition: 'background 0.1s',
      }}>
      {team ? (
        <>
          <Badge team={team} size={24} />
          <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
          {!isR1 && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }} title="点击互换胜负">⇄</span>}
        </>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400, textAlign: 'center', flex: 1, fontStyle: 'italic' }}>
          {isR1 ? '拖入队伍' : '待定'}
        </span>
      )}
    </div>
  );
}

/* ── GSL Viewer ── */

function GSLViewer({ groups }: { groups: { name: string; matches: RealMatch[] }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
      {groups.map(group => (
        <div key={group.name} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <h4 style={{ fontSize: 15, fontWeight: 640, marginBottom: 16 }}>{group.name}</h4>
          <div style={{ display: 'flex', gap: 12 }}>
            {group.matches.slice(0, 2).map(m => <div key={m.id} style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 4 }}>{m.round}</div><RCard match={m} /></div>)}
          </div>
          <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 15, color: 'var(--text-tertiary)' }}>↓ 胜者会师 ↓</div>
          {group.matches[3] && <div style={{ maxWidth: 320, margin: '0 auto' }}><div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 4 }}>{group.matches[3].round}</div><RCard match={group.matches[3]} upper /><div style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: 'var(--win)', fontWeight: 600 }}>胜者=组第1 · 败者=组第2（双双晋级）</div></div>}
          {group.matches[2] && <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--loss)', marginBottom: 10 }}>败者组</div><div style={{ maxWidth: 320, margin: '0 auto' }}><div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 4 }}>{group.matches[2].round}</div><RCard match={group.matches[2]} lower /><div style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: 'var(--text-secondary)' }}>胜者=组第3 · 败者淘汰</div></div></div>}
        </div>
      ))}
    </div>
  );
}

function RCard({ match, upper, lower }: { match: RealMatch; upper?: boolean; lower?: boolean }) {
  const a = gt(match.teamA), b = gt(match.teamB);
  const border = upper ? '1.5px solid rgba(0,122,255,0.25)' : lower ? '1.5px solid rgba(255,59,48,0.18)' : '1px solid var(--border)';
  return (
    <div style={{ background: 'white', border, borderRadius: 12, overflow: 'hidden' }}>
      <RRow team={a} won={match.winner === a.id} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '4px 12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.03)', padding: '2px 8px', borderRadius: 5 }}>{match.matchType}</span>
        {match.played ? <span style={{ fontSize: 12, fontWeight: 700 }}>{match.score}</span> : <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>即将开始</span>}
        {match.date && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{match.date}</span>}
      </div>
      <RRow team={b} won={match.winner === b.id} />
    </div>
  );
}

function RRow({ team, won }: { team: RealTeam; won: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontWeight: won ? 640 : 420, color: won ? '#1d1d1f' : 'var(--text-secondary)', fontSize: 14, background: won ? 'rgba(52,199,89,0.05)' : 'transparent' }}><Badge team={team} size={32} /><span style={{ flex: 1 }}>{team.name}</span><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>#{team.rank}</span>{won && <span style={{ color: 'var(--win)', fontSize: 14, fontWeight: 700 }}>W</span>}</div>;
}

function Badge({ team, size }: { team: RealTeam; size: number }) {
  return <div style={{ width: size, height: size, borderRadius: size / 4, flexShrink: 0, background: `linear-gradient(145deg, ${team.color}, ${team.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size / 2.8, fontWeight: 700, color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>{team.shortName.slice(0, 3)}</div>;
}
