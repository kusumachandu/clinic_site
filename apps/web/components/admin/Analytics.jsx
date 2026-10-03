'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Delta, inr, pct } from './ui';
import { Columns, Donut, HBars, TrendChart } from './charts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`;

export default function Analytics() {
  const [range, setRange] = useState(30);
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { setD(null); api(`/admin/analytics?range=${range}`).then((j) => { setD(j); setErr(''); }).catch((e) => setErr(e.message)); }, [range]);

  const k = d?.kpis;
  const avgPerDay = k ? (k.total / d.range).toFixed(1) : '–';
  const busiest = d && d.weekday.some(Boolean) ? DAYS[d.weekday.indexOf(Math.max(...d.weekday))] : '–';

  return (
    <>
      <div className="ad-top">
        <div><h1>Analytics</h1><p>{d ? `${d.from} to ${d.to}` : 'Loading…'} · compared with the previous {range} days</p></div>
        <div className="ad-chips" role="group" aria-label="Period">
          {[7, 30, 90].map((r) => <button key={r} className={`ad-chip ${range === r ? 'on' : ''}`} aria-pressed={range === r} onClick={() => setRange(r)}>Last {r} days</button>)}
        </div>
      </div>
      {err && <p className="ad-err" role="alert">{err}</p>}
      {!d && !err && <p className="ad-muted">Loading analytics…</p>}
      {d && (
        <>
          <div className="ad-kpis">
            <div className="ad-kpi"><span>Appointments</span><b>{k.total}</b><Delta now={k.total} before={k.prevTotal} /></div>
            <div className="ad-kpi g"><span>Completed</span><b>{k.completed}</b><small>{pct(k.completionRate)} of bookings</small></div>
            <div className="ad-kpi warn"><span>Cancelled or no-show</span><b>{k.lost}</b><small>{pct(k.lossRate)} of bookings</small></div>
            <div className="ad-kpi v"><span>Est. revenue</span><b>{inr(k.revenue)}</b><Delta now={k.revenue} before={k.prevRevenue} /></div>
            <div className="ad-kpi"><span>Average per day</span><b>{avgPerDay}</b><small>Busiest day: {busiest}</small></div>
          </div>

          <div className="ad-grid2">
            <section className="ad-card">
              <header><div><h2>Appointments per day</h2><small>Hover a day for exact numbers</small></div><div className="ad-legend"><span><i />Booked</span><span><i className="b" />Completed</span></div></header>
              <TrendChart data={d.trend} />
            </section>
            <section className="ad-card">
              <header><div><h2>Outcome</h2><small>Status of every booking in this period</small></div></header>
              <Donut centre={pct(k.completionRate)} caption="completed" parts={[
                { key: 'completed', label: 'Completed', value: d.status.completed },
                { key: 'confirmed', label: 'Confirmed', value: d.status.confirmed },
                { key: 'pending', label: 'Pending', value: d.status.pending },
                { key: 'cancelled', label: 'Cancelled', value: d.status.cancelled },
                { key: 'no_show', label: 'No-show', value: d.status.no_show },
              ]} />
            </section>
          </div>

          <div className="ad-grid3">
            <section className="ad-card">
              <header><div><h2>Top treatments</h2><small>By number of bookings</small></div></header>
              <HBars rows={d.services.slice(0, 6).map((s) => ({ label: s.name, value: s.count, sub: s.revenue ? `${inr(s.revenue)} est. revenue` : '' }))} />
            </section>
            <section className="ad-card">
              <header><div><h2>Doctor workload</h2><small>Bookings and completed visits</small></div></header>
              <HBars rows={d.doctors.map((x) => ({ label: x.name, value: x.count, sub: `${x.completed} completed` }))} />
            </section>
            <section className="ad-card">
              <header><div><h2>Busiest days</h2><small>Bookings by weekday</small></div></header>
              <Columns rows={DAYS.map((l, i) => ({ label: l, value: d.weekday[i] }))} />
            </section>
          </div>

          <section className="ad-card">
            <header><div><h2>Popular times</h2><small>Bookings by hour of the day</small></div></header>
            {d.hours.length ? <Columns rows={d.hours.map((h) => ({ label: hourLabel(h.hour), value: h.count }))} /> : <p className="ad-muted">No data in this period</p>}
          </section>
          <p className="ad-muted" style={{ marginTop: 14 }}>Revenue is an estimate: completed appointments multiplied by each treatment’s “from” price on the Services tab.</p>
        </>
      )}
    </>
  );
}
