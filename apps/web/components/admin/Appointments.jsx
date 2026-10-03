'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Avatar, STATUSES, label, niceDate, todayStr } from './ui';

const shift = (n) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA');

export default function Appointments({ isAdmin }) {
  const [filters, setFilters] = useState({ date: todayStr(), status: '', phone: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    const p = new URLSearchParams({ page });
    Object.entries(filters).forEach(([k, v]) => v && p.set(k, v));
    api(`/admin/appointments?${p}`).then((j) => { setData(j); setErr(''); }).catch((e) => setErr(e.message));
  }, [filters, page]);
  useEffect(() => { load(); }, [load]);

  const change = (k, v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  async function setStatus(a, status) {
    try { await api(`/admin/appointments/${a._id}`, { method: 'PATCH', body: { status } }); load(); } catch (e) { setErr(e.message); }
  }
  async function remove(a) {
    if (!confirm(`Permanently delete the appointment for ${a.name}?`)) return;
    try { await api(`/admin/appointments/${a._id}`, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); }
  }

  const quick = [['Today', todayStr()], ['Tomorrow', shift(1)], ['All dates', '']];
  return (
    <>
      <div className="ad-top"><div><h1>Appointments</h1><p>{data.total} found{filters.date ? ` for ${niceDate(filters.date)}` : ''}</p></div></div>
      <div className="ad-filters">
        <div className="ad-chips" role="group" aria-label="Quick dates">
          {quick.map(([l, v]) => <button key={l} className={`ad-chip ${filters.date === v ? 'on' : ''}`} aria-pressed={filters.date === v} onClick={() => change('date', v)}>{l}</button>)}
        </div>
        <input className="ad-in" type="date" value={filters.date} onChange={(e) => change('date', e.target.value)} aria-label="Date" />
        <select className="ad-in" value={filters.status} onChange={(e) => change('status', e.target.value)} aria-label="Status"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        <input className="ad-in ad-search" placeholder="Search by phone number" inputMode="tel" value={filters.phone} onChange={(e) => change('phone', e.target.value)} aria-label="Search by phone" />
      </div>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <div className="ad-tablewrap">
        <table className="ad-table">
          <thead><tr><th>When</th><th>Patient</th><th>Treatment</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data.items.map((a) => (
              <tr key={a._id}>
                <td><b>{a.time}</b><small>{niceDate(a.date)}</small></td>
                <td>
                  <div className="ad-pt"><Avatar name={a.name} /><div>
                    <b>{a.name}</b>
                    <small><a className="ad-link" href={`tel:${a.phone}`}>{a.phone}</a>{a.email ? ` · ${a.email}` : ''}</small>
                    {a.notes && <p className="ad-note">“{a.notes}”</p>}
                    <small>Ref {a.reference}</small>
                  </div></div>
                </td>
                <td><b>{a.service}</b><small>{a.doctor}</small></td>
                <td><select className={`ad-select ${a.status}`} value={a.status} onChange={(e) => setStatus(a, e.target.value)} aria-label={`Status for ${a.name}`}>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></td>
                <td>
                  <div className="ad-actions">
                    {a.status === 'pending' && <button className="ad-btn good sm" onClick={() => setStatus(a, 'confirmed')}>Confirm</button>}
                    {isAdmin && <button className="ad-btn ghost danger sm" onClick={() => remove(a)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && <tr><td colSpan={5} className="ad-empty"><b>🗓️</b>No appointments found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="ad-pager">
        <button className="ad-btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
        <span>Page {data.page || page} of {data.pages}</span>
        <button className="ad-btn ghost sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </>
  );
}
