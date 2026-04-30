import { Link } from 'react-router-dom';
import { tournaments as realTournaments, LAST_UPDATED } from '../engine/tournamentData';

const formats = [
  { to: '/swiss', icon: '🔄', title: '瑞士轮', english: 'Swiss System', desc: '16 队，3 胜晋级，3 败淘汰，同战绩互打。', color: '#007AFF', bg: 'rgba(0,122,255,0.06)' },
  { to: '/gsl', icon: '🔷', title: 'GSL 双败', english: 'GSL Double Elim', desc: '4 队一组，胜者组决赛定第1/第2，双双晋级。', color: '#5856D6', bg: 'rgba(88,86,214,0.06)' },
  { to: '/playoffs', icon: '🏆', title: '单败季后赛', english: 'Single Elim Playoffs', desc: '6 队或 8 队单败淘汰，一场定生死。', color: '#FF3B30', bg: 'rgba(255,59,48,0.05)' },
];

// Build Pick'Em cards from real tournament data
const pickems = Object.entries(realTournaments).map(([id, { info }]) => ({
  to: `/pickem/${id}`,
  icon: info.icon,
  name: info.name,
  full: info.fullName,
  organizer: info.organizer,
  stages: info.format,
  color: info.color,
  bg: `${info.color}10`,
  dates: info.dates,
}));

export default function Home() {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '56px 24px 64px' }} className="page-enter">
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.2, marginBottom: 14, lineHeight: 1.15, color: '#1d1d1f' }}>赛制课堂</h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65, fontWeight: 420 }}>
          理解赛制 + 真实赛事，一站式搞懂 CS2。
        </p>
      </div>

      {/* Learning cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 48 }}>
        {formats.map(f => (
          <Link key={f.to} to={f.to} style={{ textDecoration: 'none' }}>
            <Card color={f.color} bg={f.bg} icon={f.icon} title={f.title} sub={f.english} desc={f.desc} />
          </Link>
        ))}
      </div>

      {/* Real tournament cards */}
      <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 640, marginBottom: 6, color: '#1d1d1f' }}>真实赛事
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 10 }}>
            更新于 {new Date(LAST_UPDATED).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
          查看正在进行或即将开始的赛事对阵。数据来自 HLTV。每 6 小时自动更新。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pickems.length}, 1fr)`, gap: 12 }}>
          {pickems.map(p => (
            <Link key={p.to} to={p.to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                padding: 20, height: '100%',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{p.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: p.color, fontWeight: 600, marginBottom: 8 }}>{p.organizer}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 2 }}>{p.full}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>{p.stages}</div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 10 }}>{p.dates}</div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, background: p.bg, color: p.color, fontSize: 10, fontWeight: 600 }}>
                  查看对阵 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ color, bg, icon, title, sub, desc }: {
  color: string; bg: string; icon: string; title: string; sub: string; desc: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-card-solid)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 22, height: '100%',
      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 640, color: '#1d1d1f', marginBottom: 2 }}>{title}</h3>
      <p style={{ fontSize: 10, color: color, fontWeight: 600, marginBottom: 6, letterSpacing: -0.2 }}>{sub}</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}
