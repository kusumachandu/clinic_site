'use client';
import { useEffect, useMemo, useState } from 'react';
import { clinic } from '@/lib/clinic';

const iso = (d) => d.toLocaleDateString('en-CA');
const today = () => iso(new Date());
const plus = (n) => iso(new Date(Date.now() + n * 86400000));
const STEPS = ['Treatment', 'Date & time', 'Your details'];

function calendarFile(done) {
  const [y, m, d] = done.date.split('-');
  const [hh, mm] = done.time.split(':');
  const start = `${y}${m}${d}T${hh}${mm}00`;
  const end = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm) + 45);
  const p = (n) => String(n).padStart(2, '0');
  const stop = `${end.getFullYear()}${p(end.getMonth() + 1)}${p(end.getDate())}T${p(end.getHours())}${p(end.getMinutes())}00`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lume Dental//EN', 'BEGIN:VEVENT', `UID:${done.reference}@lumedental`, `DTSTAMP:${start}`, `DTSTART:${start}`, `DTEND:${stop}`, `SUMMARY:${done.service} at ${clinic.name}`, `DESCRIPTION:With ${done.doctor}. Reference ${done.reference}.`, `LOCATION:${clinic.address}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
}

export default function BookingForm({ services, doctors }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ serviceId: '', doctorId: '', date: '', time: '', name: '', phone: '', email: '', notes: '', consent: false, website: '' });
  const [slots, setSlots] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value, ...(k === 'doctorId' || k === 'date' ? { time: '' } : {}) }));

  // "Book this" buttons elsewhere on the page preselect a treatment or doctor.
  useEffect(() => {
    const onPick = (e) => {
      const { serviceId, doctorId } = e.detail || {};
      setDone(null);
      setF((x) => ({ ...x, ...(serviceId ? { serviceId } : {}), ...(doctorId ? { doctorId, time: '' } : {}) }));
      setStep(0);
    };
    window.addEventListener('lume:pick', onPick);
    return () => window.removeEventListener('lume:pick', onPick);
  }, []);

  useEffect(() => {
    if (!f.doctorId || !f.date) { setSlots(null); return undefined; }
    let live = true;
    fetch(`/api/public/slots?doctorId=${f.doctorId}&date=${f.date}`).then((r) => r.json()).then((j) => live && setSlots(j.slots || [])).catch(() => live && setSlots([]));
    return () => { live = false; };
  }, [f.doctorId, f.date]);

  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return { v: iso(d), wd: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }), n: d.getDate(), m: d.toLocaleDateString('en-IN', { month: 'short' }) };
  }), []);

  const service = services.find((s) => s._id === f.serviceId);
  const doctor = doctors.find((d) => d._id === f.doctorId);
  const dateLabel = f.date && new Date(`${f.date}T00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  function next() {
    setErr('');
    if (step === 0 && (!f.serviceId || !f.doctorId)) return setErr('Please choose a treatment and a doctor.');
    if (step === 1 && (!f.date || !f.time)) return setErr('Please pick a date and a time slot.');
    setStep(step + 1);
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/public/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify(f) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not book. Please try again.');
      setDone(json);
    } catch (e2) {
      setErr(e2.message);
      if (/time|slot/i.test(e2.message)) { setF((x) => ({ ...x, time: '' })); setStep(1); }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const share = `https://wa.me/?text=${encodeURIComponent(`My ${clinic.name} appointment: ${done.service} with ${done.doctor}, ${done.date} at ${done.time}. Ref ${done.reference}`)}`;
    return (
      <div className="lm-ok" role="status">
        <span className="lm-tick">✓</span>
        <h3>Request received</h3>
        <p>{done.service} with {done.doctor}<br />{done.date} at {done.time}</p>
        <p className="lm-ref">Reference <b>{done.reference}</b></p>
        <p className="lm-fine">We will call to confirm. Please keep this reference handy.</p>
        <div className="lm-row">
          <a className="lm-btn" href={calendarFile(done)} download="lume-dental-appointment.ics">📅 Add to calendar</a>
          <a className="lm-btn ghost" href={share} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <form className="lm-form" onSubmit={submit}>
      <ol className="lm-steps" aria-label="Progress">
        {STEPS.map((s, i) => <li key={s} className={i === step ? 'on' : i < step ? 'ok' : ''} aria-current={i === step ? 'step' : undefined}><b>{i < step ? '✓' : i + 1}</b><span>{s}</span></li>)}
      </ol>

      {step === 0 && (
        <>
          <select value={f.serviceId} onChange={set('serviceId')} aria-label="Treatment"><option value="">Choose a treatment</option>{services.map((s) => <option key={s._id} value={s._id}>{s.name}{Number(s.price) ? ` · from ₹${Number(s.price).toLocaleString('en-IN')}` : ''}</option>)}</select>
          <div className="lm-docs" role="group" aria-label="Doctor">
            {doctors.map((d) => (
              <button type="button" key={d._id} className={f.doctorId === d._id ? 'on' : ''} aria-pressed={f.doctorId === d._id} onClick={() => setF((x) => ({ ...x, doctorId: d._id, time: '' }))}>
                <i>{d.name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('')}</i><span>{d.name}<small>{d.specialty}</small></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="lm-days" role="group" aria-label="Date">
            {days.map((d) => <button type="button" key={d.v} className={f.date === d.v ? 'on' : ''} aria-pressed={f.date === d.v} onClick={() => setF((x) => ({ ...x, date: d.v, time: '' }))}><small>{d.wd}</small><b>{d.n}</b><small>{d.m}</small></button>)}
          </div>
          <label className="lm-field">Or pick a later date<input type="date" min={today()} max={plus(60)} value={f.date} onChange={set('date')} /></label>
          {!f.date && <p className="lm-fine">Choose a date to see available times.</p>}
          {slots && (slots.length === 0
            ? <p className="lm-fine">No free slots that day. Try another date.</p>
            : <div className="lm-slots" role="group" aria-label="Available times">{slots.map((s) => <button type="button" key={s} className={f.time === s ? 'on' : ''} aria-pressed={f.time === s} onClick={() => setF((x) => ({ ...x, time: s }))}>{s}</button>)}</div>)}
        </>
      )}

      {step === 2 && (
        <>
          <div className="lm-summary"><b>{service?.name}</b> with {doctor?.name}<br />{dateLabel} at {f.time}</div>
          <input required maxLength={80} placeholder="Full name" value={f.name} onChange={set('name')} aria-label="Full name" autoComplete="name" />
          <input required inputMode="tel" maxLength={20} placeholder="Mobile number" value={f.phone} onChange={set('phone')} aria-label="Mobile number" autoComplete="tel" />
          <input type="email" maxLength={120} placeholder="Email (optional)" value={f.email} onChange={set('email')} aria-label="Email" autoComplete="email" />
          <textarea maxLength={500} rows={2} placeholder="Anything we should know? (optional)" value={f.notes} onChange={set('notes')} aria-label="Notes" />
          <input className="lm-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} name="website" />
          <label className="lm-check"><input type="checkbox" checked={f.consent} onChange={set('consent')} required /> I agree that Lume Dental may store my details to manage my appointment.</label>
          <p className="lm-fine">🔒 Your details are encrypted and used only to manage your appointment.</p>
        </>
      )}

      {err && <p className="lm-err" role="alert">{err}</p>}
      <div className="lm-row">
        {step > 0 && <button type="button" className="lm-btn ghost" onClick={() => { setErr(''); setStep(step - 1); }}>← Back</button>}
        {step < 2
          ? <button type="button" className="lm-btn" onClick={next}>Continue →</button>
          : <button className="lm-btn" disabled={busy}>{busy ? 'Booking…' : 'Request appointment'}</button>}
      </div>
    </form>
  );
}
