'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Avatar } from './ui';

const BLANK = { name: '', email: '', password: '', role: 'staff' };

export default function Staff() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(BLANK);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api('/admin/users').then(setList).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault(); setErr(''); setMsg('');
    try { await api('/admin/users', { method: 'POST', body: f }); setF(BLANK); setMsg('Account created.'); load(); }
    catch (e2) { setErr(e2.message); }
  }
  async function toggle(u) {
    setErr('');
    try { await api(`/admin/users/${u._id}`, { method: 'PATCH', body: { active: !u.active } }); load(); } catch (e) { setErr(e.message); }
  }
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <div className="ad-top"><div><h1>Staff accounts</h1><p>Admins see everything. Staff see appointments only.</p></div></div>
      <div className="ad-grid2e">
        <section className="ad-card">
          <header><h2>Team</h2></header>
          {err && <p className="ad-err" role="alert">{err}</p>}
          <ul className="ad-list ad-manage">
            {list.map((u) => (
              <li key={u._id} className={`ad-item ${u.active ? '' : 'off'}`}>
                <Avatar name={u.name} />
                <div><h3>{u.name} <span className="ad-tag">{u.role}</span></h3><p>{u.email}</p></div>
                <button className="ad-btn ghost sm" onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</button>
              </li>
            ))}
          </ul>
        </section>
        <form className="ad-card ad-form" onSubmit={add} style={{ maxWidth: 'none', alignContent: 'start' }}>
          <header><h2>Add a team member</h2></header>
          <div className="ad-two">
            <label>Name<input className="ad-in" required value={f.name} onChange={up('name')} /></label>
            <label>Email<input className="ad-in" required type="email" value={f.email} onChange={up('email')} /></label>
          </div>
          <label>Temporary password (12+ characters)<input className="ad-in" required type="password" minLength={12} autoComplete="new-password" value={f.password} onChange={up('password')} /></label>
          <label>Role<select className="ad-in" value={f.role} onChange={up('role')}><option value="staff">Staff (appointments only)</option><option value="admin">Admin (full access)</option></select></label>
          {msg && <p className="ad-ok" role="status">{msg}</p>}
          <button className="ad-btn">Create account</button>
        </form>
      </div>
    </>
  );
}
