'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Avatar, Delta, StatusPill, inr, niceDate, pct, todayStr } from './ui';
import { TrendChart } from './charts';

export default function Overview({ user, isAdmin, go }) {
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState([]);
  const [pending, setPending] = useState([]);
  const [an, setAn] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api('/admin/stats').then(setStats).catch((e) => setErr(e.message));
    api(`/admin/appointments?date=${todayStr()}`).then((j) => setToday(j.items)).catch(() => {});
    api('/admin/appointments?status=pending').then((j) => setPending(j.items.filter((a) => a.date >= todayStr()))).catch(() => {});
    if (isAdmin) api('/admin/analytics?range=30').then(setAn).catch(() => {});
  }, [isAdmin]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(a, status) {
    try { await api(`/admin/appointments/${a._id}`, { method: 'PATCH', body: { status } }); load(); } catch (e) { setErr(e.message); }
  }

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const k = an?.kpis;
  const live = today.filter((a) => a.status !== 'cancelled' && a.status !== 'no_show');

  return (
    <>
      <div className="ad-top">
        <div><h1>{hello}, {user.name.split(' ')[0]}</h1><p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        <div className="ad-actions"><button className="ad-btn ghost" onClick={load}>↻ Refresh</button><button className="ad-btn" onClick={() => go('appointments')}>All appointments →</button></div>
      </div>
      {err && <p className="ad-err" role="alert">{err}</p>}

      <div className="ad-kpis">
        <div className="ad-kpi"><span>Today’s appointments</span><b>{stats ? stats.today : '–'}</b><small>{live.filter((a) => a.status === 'completed').length} completed so far</small></div>
        <div className="ad-kpi warn"><span>Awaiting confirmation</span><b>{stats ? stats.pending : '–'}</b><small>{stats?.pending ? 'Call these patients to confirm' : 'You are all caught up'}</small></div>
        <div className="ad-kpi v"><span>Upcoming</span><b>{stats ? stats.upcoming : '–'}</b><small>Booked from today onwards</small></div>
        {k && <>
          <div className="ad-kpi g"><span>Bookings, last 30 days</span><b>{k.total}</b><Delta now={k.total} before={k.prevTotal} /></div>
          <div className="ad-kpi"><span>Completion rate</span><b>{pct(k.completionRate)}</b><small>{k.completed} completed · {k.lost} lost</small></div>
          <div className="ad-kpi v"><span>Est. revenue, 30 days</span><b>{inr(k.revenue)}</b><Delta now={k.revenue} before={k.prevRevenue} /></div>
        </>}
      </div>

      <div className="ad-grid2">
        <section className="ad-card">
          <header><div><h2>Today’s schedule</h2><small>{live.length} active appointment{live.length === 1 ? '' : 's'}</small></div><button className="ad-btn ghost sm" onClick={() => go('appointments')}>Open</button></header>
          {today.length === 0 ? <div className="ad-empty"><b>🌿</b>No appointments today.</div> : (
            <ul className="ad-list">
              {today.map((a) => (
                <li key={a._id} className={`ad-item ${a.status === 'cancelled' || a.status === 'no_show' ? 'off' : ''}`}>
                  <div className="ad-time">{a.time}</div>
                  <div><h3>{a.name}</h3><p>{a.service} · {a.doctor}</p></div>
                  <div className="ad-actions">
                    <StatusPill status={a.status} />
                    {a.status === 'pending' && <button className="ad-btn good sm" onClick={() => setStatus(a, 'confirmed')}>Confirm</button>}
                    {a.status === 'confirmed' && <button className="ad-btn sm" onClick={() => setStatus(a, 'completed')}>Mark done</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ad-card">
          <header><div><h2>Needs confirmation</h2><small>Oldest first</small></div></header>
          {pending.length === 0 ? <div className="ad-empty"><b>✅</b>Nothing waiting.</div> : (
            <ul className="ad-list">
              {pending.slice(0, 6).map((a) => (
                <li key={a._id} className="ad-item" style={{ gridTemplateColumns: 'auto minmax(0,1fr)' }}>
                  <Avatar name={a.name} />
                  <div><h3>{a.name}</h3><p>{niceDate(a.date)} · {a.time} · {a.service}</p><p><a className="ad-link" href={`tel:${a.phone}`}>📞 {a.phone}</a></p></div>
                  <div className="ad-actions" style={{ gridColumn: '1/-1' }}>
                    <button className="ad-btn good sm" onClick={() => setStatus(a, 'confirmed')}>Confirm</button>
                    <button className="ad-btn ghost danger sm" onClick={() => setStatus(a, 'cancelled')}>Cancel</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {an && (
        <section className="ad-card">
          <header><div><h2>Bookings, last 30 days</h2><small>Daily appointments and completed visits</small></div><button className="ad-btn ghost sm" onClick={() => go('analytics')}>Full analytics →</button></header>
          <TrendChart data={an.trend} />
          <div className="ad-legend"><span><i />Booked</span><span><i className="b" />Completed</span></div>
        </section>
      )}
    </>
  );
}
