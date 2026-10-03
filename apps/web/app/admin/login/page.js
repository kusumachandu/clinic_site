'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem('lume-theme'); } catch { /* ignore */ }
    setDark(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await api('/auth/login', { method: 'POST', body: f }); router.push('/admin'); }
    catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="ad ad-login" data-theme={dark ? 'dark' : 'light'}>
      <form className="ad-card ad-form" onSubmit={submit}>
        <div className="ad-brand" style={{ padding: 0 }}><i>🦷</i><span>Lume Dental<small>Staff sign-in</small></span></div>
        <div><h1>Welcome back</h1><p className="ad-muted">Sign in to manage appointments and see how the clinic is doing.</p></div>
        <label>Email<input className="ad-in" type="email" required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input className="ad-in" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p className="ad-err" role="alert">{err}</p>}
        <button className="ad-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <small>🔒 Sessions end after 15 minutes of inactivity.</small>
      </form>
    </div>
  );
}
