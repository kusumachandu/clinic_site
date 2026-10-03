export function nowInTz(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` };
}

export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function inBookingWindow(dateStr, tz, maxDays = 60) {
  if (!isRealDate(dateStr)) return false;
  const today = nowInTz(tz).date;
  const max = new Date(new Date(`${today}T00:00:00Z`).getTime() + maxDays * 86400000).toISOString().slice(0, 10);
  return dateStr >= today && dateStr <= max;
}

export function generateSlots(doctor, dateStr) {
  const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  if (!doctor.workingDays.includes(dow)) return [];
  const out = [];
  for (let m = toMin(doctor.startTime); m + doctor.slotMinutes <= toMin(doctor.endTime); m += doctor.slotMinutes) out.push(fmt(m));
  return out;
}

export function availableSlots(doctor, dateStr, booked, tz) {
  const now = nowInTz(tz);
  if (dateStr < now.date) return [];
  let slots = generateSlots(doctor, dateStr).filter((s) => !booked.has(s));
  if (dateStr === now.date) slots = slots.filter((s) => toMin(s) > toMin(now.time) + 30); // 30-minute notice
  return slots;
}
