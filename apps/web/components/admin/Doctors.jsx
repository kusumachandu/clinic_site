'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Avatar } from './ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EMPTY = { name: '', specialty: '', bio: '', workingDays: [1, 2, 3, 4, 5], startTime: '10:00', endTime: '18:00', slotMinutes: 30, active: true };

export default function Doctors() {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api('/admin/doctors').then(setList).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault(); setErr('');
    const { _id, createdAt, updatedAt, __v, ...body } = edit;
    try { await api(_id ? `/admin/doctors/${_id}` : '/admin/doctors', { method: _id ? 'PUT' : 'POST', body: { ...body, slotMinutes: Number(body.slotMinutes) } }); setEdit(null); load(); }
    catch (e2) { setErr(e2.message); }
  }
  async function remove(d) {
    if (!confirm(`Delete ${d.name}?`)) return;
    try { await api(`/admin/doctors/${d._id}`, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); }
  }
  const toggleDay = (i) => setEdit((d) => ({ ...d, workingDays: d.workingDays.includes(i) ? d.workingDays.filter((x) => x !== i) : [...d.workingDays, i].sort() }));
  const up = (k) => (e) => setEdit({ ...edit, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  if (edit) {
    return (
      <>
        <div className="ad-top"><h1>{edit._id ? 'Edit doctor' : 'New doctor'}</h1></div>
        <form className="ad-card ad-form" onSubmit={save}>
          <label>Name<input className="ad-in" required value={edit.name} onChange={up('name')} /></label>
          <label>Specialty<input className="ad-in" value={edit.specialty} onChange={up('specialty')} /></label>
          <label>Short bio<textarea className="ad-in" rows={2} value={edit.bio} onChange={up('bio')} /></label>
          <div className="ad-days" role="group" aria-label="Working days">{DAYS.map((d, i) => <label key={d}><input type="checkbox" checked={edit.workingDays.includes(i)} onChange={() => toggleDay(i)} /> {d}</label>)}</div>
          <div className="ad-two">
            <label>Starts<input className="ad-in" type="time" value={edit.startTime} onChange={up('startTime')} /></label>
            <label>Ends<input className="ad-in" type="time" value={edit.endTime} onChange={up('endTime')} /></label>
          </div>
          <label>Minutes per appointment<input className="ad-in" type="number" min="10" max="120" step="5" value={edit.slotMinutes} onChange={up('slotMinutes')} /></label>
          <label className="inline"><input type="checkbox" checked={edit.active} onChange={up('active')} /> Accepting bookings</label>
          {err && <p className="ad-err" role="alert">{err}</p>}
          <div className="ad-actions"><button className="ad-btn">Save doctor</button><button type="button" className="ad-btn ghost" onClick={() => { setEdit(null); setErr(''); }}>Cancel</button></div>
        </form>
      </>
    );
  }
  return (
    <>
      <div className="ad-top"><div><h1>Doctors</h1><p>Working hours decide which times patients can book.</p></div><button className="ad-btn" onClick={() => setEdit({ ...EMPTY })}>+ Add doctor</button></div>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <ul className="ad-list ad-manage">
        {list.map((d) => (
          <li key={d._id} className={`ad-item ${d.active ? '' : 'off'}`}>
            <Avatar name={d.name} />
            <div><h3>{d.name} <span className={`ad-tag ${d.active ? 'live' : ''}`}>{d.active ? 'Accepting bookings' : 'Paused'}</span></h3><p>{d.specialty} · {d.workingDays.map((i) => DAYS[i]).join(', ')} · {d.startTime}–{d.endTime} · {d.slotMinutes} min</p></div>
            <div className="ad-actions"><button className="ad-btn ghost sm" onClick={() => setEdit({ ...EMPTY, ...d })}>Edit</button><button className="ad-btn ghost danger sm" onClick={() => remove(d)}>Delete</button></div>
          </li>
        ))}
      </ul>
    </>
  );
}
