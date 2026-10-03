'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import Overview from '@/components/admin/Overview';
import Appointments from '@/components/admin/Appointments';
import Analytics from '@/components/admin/Analytics';
import Doctors from '@/components/admin/Doctors';
import Services from '@/components/admin/Services';
import Staff from '@/components/admin/Staff';
import Audit from '@/components/admin/Audit';
import { Avatar } from '@/components/admin/ui';

const IDLE_MS = 15 * 60 * 1000;

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('overview');
  const [dark, setDark] = useState(true);
  const [pending, setPending] = useState(0);
  const timer = useRef(null);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.replace('/admin/login');
  }, [router]);

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem('lume-theme'); } catch { /* ignore */ }
    setDark(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
    api('/auth/me').then((j) => setUser(j.user)).catch(() => {});
  }, []);

  // Badge on the Appointments tab: bookings still waiting for a confirmation call.
  useEffect(() => {
    if (!user) return undefined;
    const get = () => api('/admin/stats').then((s) => setPending(s.pending)).catch(() => {});
    get();
    const id = setInterval(get, 60000);
    return () => clearInterval(id);
  }, [user, tab]);

  // Sign out automatically after 15 minutes without activity (shared reception computers).
  useEffect(() => {
    const reset = () => { clearTimeout(timer.current); timer.current = setTimeout(logout, IDLE_MS); };
    ['pointerdown', 'keydown', 'scroll'].forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer.current); ['pointerdown', 'keydown', 'scroll'].forEach((e) => window.removeEventListener(e, reset)); };
  }, [logout]);

  function toggleTheme() {
    const d = !dark;
    setDark(d);
    try { localStorage.setItem('lume-theme', d ? 'dark' : 'light'); } catch { /* ignore */ }
  }

  if (!user) return null;
  const isAdmin = user.role === 'admin';
  const tabs = [
    ['overview', '🏠', 'Overview'],
    ['appointments', '🗓️', 'Appointments'],
    ...(isAdmin ? [['analytics', '📊', 'Analytics'], ['doctors', '🩺', 'Doctors'], ['services', '✨', 'Services'], ['staff', '👥', 'Staff'], ['audit', '🛡️', 'Activity log']] : []),
  ];

  return (
    <div className="ad" data-theme={dark ? 'dark' : 'light'}>
      <aside className="ad-side">
        <div className="ad-brand"><i>🦷</i><span>Lume Dental<small>Clinic admin</small></span></div>
        <nav className="ad-nav" aria-label="Admin sections">
          {tabs.map(([k, icon, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
              <span aria-hidden="true">{icon}</span>{l}{k === 'appointments' && pending > 0 && <em title={`${pending} awaiting confirmation`}>{pending}</em>}
            </button>
          ))}
        </nav>
        <div className="ad-side-foot">
          <div className="ad-user"><Avatar name={user.name} /><div><b>{user.name}</b><small>{user.role}</small></div></div>
          <button className="ad-btn ghost sm" onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
          <a className="ad-btn ghost sm" href="/" target="_blank" rel="noopener noreferrer">Website ↗</a>
          <button className="ad-btn ghost sm" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="ad-main">
        {tab === 'overview' && <Overview user={user} isAdmin={isAdmin} go={setTab} />}
        {tab === 'appointments' && <Appointments isAdmin={isAdmin} />}
        {tab === 'analytics' && isAdmin && <Analytics />}
        {tab === 'doctors' && isAdmin && <Doctors />}
        {tab === 'services' && isAdmin && <Services />}
        {tab === 'staff' && isAdmin && <Staff />}
        {tab === 'audit' && isAdmin && <Audit />}
      </main>
    </div>
  );
}
