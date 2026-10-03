// Dependency-free SVG charts. Colours come from CSS variables so they follow the light/dark theme.
const niceMax = (v) => {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = [1, 2, 2.5, 5, 10].find((x) => x * p >= v);
  return m * p;
};
const shortDate = (d) => new Date(`${d}T00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Daily bookings (area) with completed visits overlaid (line).
export function TrendChart({ data }) {
  const W = 640, H = 240, L = 34, R = 10, T = 12, B = 28;
  const max = niceMax(Math.max(1, ...data.map((d) => d.count)));
  const x = (i) => L + (data.length === 1 ? 0 : (i * (W - L - R)) / (data.length - 1));
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const line = (k) => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[k]).toFixed(1)}`).join(' ');
  const area = `${line('count')} L${x(data.length - 1)} ${H - B} L${x(0)} ${H - B}Z`;
  const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);
  const every = Math.max(1, Math.ceil(data.length / 6));
  const step = (W - L - R) / Math.max(1, data.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ad-chart" role="img" aria-label="Appointments per day">
      <defs><linearGradient id="adg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--ac)" stopOpacity=".38" /><stop offset="1" stopColor="var(--ac)" stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="ad-grid" /><text x={L - 6} y={y(t) + 4} textAnchor="end" className="ad-axis">{Math.round(t)}</text></g>)}
      <path d={area} fill="url(#adg)" />
      <path d={line('count')} className="ad-line a" />
      <path d={line('completed')} className="ad-line b" />
      {data.map((d, i) => (
        <g key={d.date}>
          {i % every === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" className="ad-axis">{shortDate(d.date)}</text>}
          <rect x={x(i) - step / 2} y={T} width={Math.max(step, 4)} height={H - T - B} fill="transparent"><title>{`${shortDate(d.date)}: ${d.count} booked, ${d.completed} completed`}</title></rect>
          {data.length <= 31 && d.count > 0 && <circle cx={x(i)} cy={y(d.count)} r="3" className="ad-dot" />}
        </g>
      ))}
    </svg>
  );
}

// Horizontal bars with the value printed at the end, so exact numbers are always readable.
export function HBars({ rows, format = (v) => v, empty = 'No data in this period' }) {
  if (!rows.length) return <p className="ad-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="ad-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="ad-bar-top"><span>{r.label}</span><b>{format(r.value)}</b></div>
          <div className="ad-bar"><i style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} /></div>
          {r.sub && <small>{r.sub}</small>}
        </li>
      ))}
    </ul>
  );
}

// Vertical columns for weekday and hour-of-day distribution.
export function Columns({ rows, peak = true }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const top = peak ? rows.reduce((a, r) => (r.value > a.value ? r : a), rows[0]) : null;
  return (
    <div className="ad-cols" role="img" aria-label={rows.map((r) => `${r.label} ${r.value}`).join(', ')}>
      {rows.map((r) => (
        <div key={r.label} className={`ad-col ${top && top === r && r.value ? 'peak' : ''}`} title={`${r.label}: ${r.value}`}>
          <b>{r.value || ''}</b>
          <i style={{ height: `${(r.value / max) * 100}%` }} />
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

// Donut with a legend that carries the numbers.
export function Donut({ parts, centre, caption }) {
  const total = parts.reduce((t, p) => t + p.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="ad-donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
        <circle cx="70" cy="70" r={R} className="ad-ring" />
        {total > 0 && parts.filter((p) => p.value).map((p) => {
          const len = (p.value / total) * C;
          const el = <circle key={p.label} cx="70" cy="70" r={R} className={`ad-seg ${p.key}`} strokeDasharray={`${Math.max(len - 2, 0.5)} ${C}`} strokeDashoffset={-off} transform="rotate(-90 70 70)"><title>{`${p.label}: ${p.value}`}</title></circle>;
          off += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" className="ad-dc">{centre}</text>
        <text x="70" y="86" textAnchor="middle" className="ad-dcap">{caption}</text>
      </svg>
      <ul>{parts.map((p) => <li key={p.label}><i className={`ad-sw ${p.key}`} />{p.label}<b>{p.value}</b></li>)}</ul>
    </div>
  );
}
