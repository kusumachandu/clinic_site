'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { inr } from './ui';

const EMPTY = { name: '', description: '', price: 0, active: true, sortOrder: 100 };

export default function Services() {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api('/admin/services').then(setList).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault(); setErr('');
    const { _id, createdAt, updatedAt, __v, ...body } = edit;
    try { await api(_id ? `/admin/services/${_id}` : '/admin/services', { method: _id ? 'PUT' : 'POST', body: { ...body, price: Number(body.price), sortOrder: Number(body.sortOrder) } }); setEdit(null); load(); }
    catch (e2) { setErr(e2.message); }
  }
  async function remove(s) {
    if (!confirm(`Delete ${s.name}?`)) return;
    try { await api(`/admin/services/${s._id}`, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); }
  }
  const up = (k) => (e) => setEdit({ ...edit, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  if (edit) {
    return (
      <>
        <div className="ad-top"><h1>{edit._id ? 'Edit treatment' : 'New treatment'}</h1></div>
        <form className="ad-card ad-form" onSubmit={save}>
          <label>Name<input className="ad-in" required value={edit.name} onChange={up('name')} /></label>
          <label>Description<textarea className="ad-in" rows={2} value={edit.description} onChange={up('description')} /></label>
          <div className="ad-two">
            <label>Starting price (₹)<input className="ad-in" type="number" min="0" value={edit.price} onChange={up('price')} /></label>
            <label>Order on page<input className="ad-in" type="number" value={edit.sortOrder} onChange={up('sortOrder')} /></label>
          </div>
          <label className="inline"><input type="checkbox" checked={edit.active} onChange={up('active')} /> Visible on website</label>
          {err && <p className="ad-err" role="alert">{err}</p>}
          <div className="ad-actions"><button className="ad-btn">Save treatment</button><button type="button" className="ad-btn ghost" onClick={() => { setEdit(null); setErr(''); }}>Cancel</button></div>
        </form>
      </>
    );
  }
  return (
    <>
      <div className="ad-top"><div><h1>Services</h1><p>Treatments and prices shown on the website and used for revenue estimates.</p></div><button className="ad-btn" onClick={() => setEdit({ ...EMPTY })}>+ Add treatment</button></div>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <ul className="ad-list ad-manage">
        {list.map((s) => (
          <li key={s._id} className={`ad-item ${s.active ? '' : 'off'}`} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
            <div><h3>{s.name} <span className={`ad-tag ${s.active ? 'live' : ''}`}>{s.active ? 'Visible' : 'Hidden'}</span></h3><p>From {inr(s.price)} · {s.description}</p></div>
            <div className="ad-actions"><button className="ad-btn ghost sm" onClick={() => setEdit({ ...EMPTY, ...s })}>Edit</button><button className="ad-btn ghost danger sm" onClick={() => remove(s)}>Delete</button></div>
          </li>
        ))}
      </ul>
    </>
  );
}
