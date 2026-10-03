import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config.js';
import { Appointment, AuditLog, Doctor, Service, User, isActiveStatus } from '../models.js';
import { blindIndex, decrypt, normalizePhone } from '../crypto.js';
import { nowInTz } from '../slots.js';
import { audit, requireAuth, requireHeader, wrap } from '../middleware.js';

const router = Router();
router.use(requireHeader);

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const PAGE = 25;

/* ---------- appointments (staff and admin) ---------- */
const view = (a) => ({
  _id: String(a._id), reference: a.reference,
  name: decrypt(a.nameEnc), phone: decrypt(a.phoneEnc), email: decrypt(a.emailEnc), notes: decrypt(a.notesEnc),
  date: a.date, time: a.time, status: a.status,
  doctor: a.doctorId?.name || '', service: a.serviceId?.name || '', createdAt: a.createdAt,
});

router.get('/appointments', requireAuth(), wrap(async (req, res) => {
  const q = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(STATUSES).optional(),
    phone: z.string().max(20).optional(),
    page: z.coerce.number().int().min(1).default(1),
  }).parse(req.query);
  const filter = {};
  if (q.date) filter.date = q.date;
  if (q.status) filter.status = q.status;
  if (q.phone) filter.phoneHash = blindIndex(normalizePhone(q.phone));
  const [rows, total] = await Promise.all([
    Appointment.find(filter).sort({ date: 1, time: 1 }).skip((q.page - 1) * PAGE).limit(PAGE)
      .populate('doctorId', 'name').populate('serviceId', 'name').lean(),
    Appointment.countDocuments(filter),
  ]);
  await audit(req, 'appointments.view', 'appointment');
  res.json({ items: rows.map(view), total, page: q.page, pages: Math.max(1, Math.ceil(total / PAGE)) });
}));

router.get('/stats', requireAuth(), wrap(async (req, res) => {
  const today = nowInTz(config.tz).date;
  const [todayCount, pending, upcoming] = await Promise.all([
    Appointment.countDocuments({ date: today, active: true }),
    Appointment.countDocuments({ status: 'pending', date: { $gte: today } }),
    Appointment.countDocuments({ date: { $gte: today }, active: true }),
  ]);
  res.json({ today: todayCount, pending, upcoming });
}));

// Aggregated numbers for the analytics dashboard. No personal data is read or returned.
router.get('/analytics', requireAuth('admin'), wrap(async (req, res) => {
  const { range } = z.object({ range: z.coerce.number().int().refine((n) => [7, 30, 90].includes(n)).default(30) }).parse(req.query);
  const today = nowInTz(config.tz).date;
  const shift = (d, n) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
  const from = shift(today, -(range - 1));
  const prevFrom = shift(from, -range);
  const [rows, services, doctors] = await Promise.all([
    Appointment.find({ date: { $gte: prevFrom, $lte: today } }).select('date time status serviceId doctorId').lean(),
    Service.find().select('name price').lean(),
    Doctor.find().select('name').lean(),
  ]);
  const price = new Map(services.map((s) => [String(s._id), Number(s.price) || 0]));
  const cur = rows.filter((r) => r.date >= from);
  const prev = rows.filter((r) => r.date < from);
  const revenue = (list) => list.filter((r) => r.status === 'completed').reduce((t, r) => t + (price.get(String(r.serviceId)) || 0), 0);

  const trend = Array.from({ length: range }, (_, i) => ({ date: shift(from, i), count: 0, completed: 0 }));
  const idx = new Map(trend.map((t, i) => [t.date, i]));
  const status = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
  const weekday = Array(7).fill(0);
  const hours = {};
  const bySvc = new Map(services.map((s) => [String(s._id), { name: s.name, count: 0, revenue: 0 }]));
  const byDoc = new Map(doctors.map((d) => [String(d._id), { name: d.name, count: 0, completed: 0 }]));
  for (const r of cur) {
    const t = trend[idx.get(r.date)];
    t.count += 1;
    if (r.status === 'completed') t.completed += 1;
    status[r.status] += 1;
    weekday[new Date(`${r.date}T00:00:00Z`).getUTCDay()] += 1;
    const h = Number(r.time.slice(0, 2));
    hours[h] = (hours[h] || 0) + 1;
    const sv = bySvc.get(String(r.serviceId));
    if (sv) { sv.count += 1; if (r.status === 'completed') sv.revenue += price.get(String(r.serviceId)) || 0; }
    const dc = byDoc.get(String(r.doctorId));
    if (dc) { dc.count += 1; if (r.status === 'completed') dc.completed += 1; }
  }
  const done = status.completed, lost = status.cancelled + status.no_show;
  res.json({
    range, from, to: today,
    kpis: {
      total: cur.length, prevTotal: prev.length,
      completed: done, lost,
      completionRate: cur.length ? done / cur.length : 0,
      lossRate: cur.length ? lost / cur.length : 0,
      revenue: revenue(cur), prevRevenue: revenue(prev),
    },
    trend, status, weekday,
    hours: Object.keys(hours).map(Number).sort((a, b) => a - b).map((h) => ({ hour: h, count: hours[h] })),
    services: [...bySvc.values()].filter((s) => s.count).sort((a, b) => b.count - a.count),
    doctors: [...byDoc.values()].filter((d) => d.count).sort((a, b) => b.count - a.count),
  });
}));

router.patch('/appointments/:id', requireAuth(), wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  appt.status = status;
  appt.active = isActiveStatus(status);
  await appt.save();
  await audit(req, `appointment.status.${status}`, 'appointment', appt._id);
  res.json({ ok: true });
}));

router.delete('/appointments/:id', requireAuth('admin'), wrap(async (req, res) => {
  const appt = await Appointment.findByIdAndDelete(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  await audit(req, 'appointment.delete', 'appointment', appt._id);
  res.status(204).end();
}));

/* ---------- doctors and services (admin only) ---------- */
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const doctorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  specialty: z.string().trim().max(80).default(''),
  bio: z.string().trim().max(400).default(''),
  workingDays: z.array(z.number().int().min(0).max(6)).max(7).default([1, 2, 3, 4, 5]),
  startTime: time.default('10:00'),
  endTime: time.default('18:00'),
  slotMinutes: z.coerce.number().int().min(10).max(120).default(30),
  active: z.boolean().default(true),
}).refine((d) => d.startTime < d.endTime, { message: 'End time must be after start time' });
const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(''),
  price: z.coerce.number().min(0).max(10000000).default(0),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().default(100),
});

function crud(path, Model, schema, label) {
  router.get(`/${path}`, requireAuth(), wrap(async (req, res) => res.json(await Model.find().sort({ name: 1 }).lean())));
  router.post(`/${path}`, requireAuth('admin'), wrap(async (req, res) => {
    const doc = await Model.create(schema.parse(req.body));
    await audit(req, `${label}.create`, label, doc._id);
    res.status(201).json(doc);
  }));
  router.put(`/${path}/:id`, requireAuth('admin'), wrap(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, schema.parse(req.body), { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await audit(req, `${label}.update`, label, doc._id);
    res.json(doc);
  }));
  router.delete(`/${path}/:id`, requireAuth('admin'), wrap(async (req, res) => {
    const used = await Appointment.exists({ [label === 'doctor' ? 'doctorId' : 'serviceId']: req.params.id });
    if (used) return res.status(409).json({ error: `This ${label} has appointments. Mark it inactive instead of deleting.` });
    await Model.findByIdAndDelete(req.params.id);
    await audit(req, `${label}.delete`, label, req.params.id);
    res.status(204).end();
  }));
}
crud('doctors', Doctor, doctorSchema, 'doctor');
crud('services', Service, serviceSchema, 'service');

/* ---------- staff accounts and audit log (admin only) ---------- */
router.get('/users', requireAuth('admin'), wrap(async (req, res) => {
  res.json(await User.find().select('name email role active createdAt').sort({ createdAt: 1 }).lean());
}));

router.post('/users', requireAuth('admin'), wrap(async (req, res) => {
  const d = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(120),
    password: z.string().min(12, 'Password must be at least 12 characters').max(200),
    role: z.enum(['admin', 'staff']).default('staff'),
  }).parse(req.body);
  const user = await User.create({ name: d.name, email: d.email, role: d.role, passwordHash: await bcrypt.hash(d.password, 12) });
  await audit(req, 'user.create', 'user', user._id);
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
}));

router.patch('/users/:id', requireAuth('admin'), wrap(async (req, res) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  if (String(req.user._id) === req.params.id) return res.status(400).json({ error: 'You cannot disable your own account' });
  await User.findByIdAndUpdate(req.params.id, { active });
  await audit(req, active ? 'user.enable' : 'user.disable', 'user', req.params.id);
  res.json({ ok: true });
}));

router.get('/audit', requireAuth('admin'), wrap(async (req, res) => {
  res.json(await AuditLog.find().sort({ createdAt: -1 }).limit(150).lean());
}));

export default router;
