'use client';
import { useEffect, useState } from 'react';
import { clinic } from '@/lib/clinic';

const LINKS = [['services', 'Services'], ['tools', 'Smart tools'], ['team', 'Doctors'], ['plans', 'Pricing'], ['faq', 'FAQ'], ['contact', 'Contact']];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function openStatus() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: clinic.tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = DAYS.indexOf(get('weekday'));
  const now = (Number(get('hour')) % 24) + Number(get('minute')) / 60;
  const [o, c] = clinic.hours[day];
  const t = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
  if (now >= o && now < c) return { open: true, text: `Open now · until ${t(c)}` };
  return { open: false, text: now < o ? `Closed · opens ${t(o)}` : 'Closed · emergency line 24/7' };
}

const setTheme = (dark) => { document.querySelector('.lume').dataset.theme = dark ? 'dark' : 'light'; };

export default function Nav() {
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setStatus(openStatus());
    const id = setInterval(() => setStatus(openStatus()), 60000);
    let saved = null;
    try { saved = localStorage.getItem('lume-theme'); } catch {}
    const d = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(d);
    setTheme(d);
    return () => clearInterval(id);
  }, []);

  function toggle() {
    const d = !dark;
    setDark(d);
    setTheme(d);
    try { localStorage.setItem('lume-theme', d ? 'dark' : 'light'); } catch {}
  }

  return (
    <>
      <div className="lm-bar">New patients: free consultation and 3D smile preview this month ✨</div>
      <header className="lm-nav lm-glass">
        <a className="lm-logo" href="#top"><i>🦷</i>Lume Dental</a>
        {status && <span className={`lm-open ${status.open ? 'on' : ''}`}><b />{status.text}</span>}
        <nav className="lm-links" aria-label="Main">{LINKS.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}</nav>
        <button type="button" className="lm-icon" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
        <a className="lm-btn" href="#book">Book a visit</a>
        <button type="button" className="lm-icon lm-burger" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(!menu)}>{menu ? '✕' : '☰'}</button>
        {menu && (
          <div className="lm-drawer lm-glass" onClick={() => setMenu(false)}>
            {LINKS.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
            <a href={`tel:${clinic.tel}`}>📞 Call {clinic.phone}</a>
          </div>
        )}
      </header>
    </>
  );
}
