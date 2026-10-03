'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => { api('/admin/audit').then(setRows).catch((e) => setErr(e.message)); }, []);
  return (
    <>
      <div className="ad-top"><div><h1>Activity log</h1><p>Who viewed or changed patient data, newest first (last 150 events).</p></div></div>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <div className="ad-tablewrap">
        <table className="ad-table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>IP</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r._id}><td>{new Date(r.createdAt).toLocaleString('en-IN')}</td><td>{r.email || '-'}</td><td><code>{r.action}</code></td><td>{r.ip}</td></tr>)}
            {rows.length === 0 && <tr><td colSpan={4} className="ad-empty">No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
