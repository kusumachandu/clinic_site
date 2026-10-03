import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { Appointment, Doctor, Service } from '../models.js';
import { blindIndex, encrypt, newReference, normalizePhone } from '../crypto.js';
import { availableSlots, inBookingWindow } from '../slots.js';
import { wrap } from '../middleware.js';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid selection');
const limiter = (max, windowMs) => rateLimit({ windowMs, limit: max, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } });

router.get('/services', wrap(async (req, res) => {
  const rows = await Service.find({ active: true }).sort({ sortOrder: 1, name: 1 }).select('name description price').lean();
  res.set('Cache-Control', 'public, max-age=60').json(rows);
}));

router.get('/doctors', wrap(async (req, res) => {
  const rows = await Doctor.find({ active: true }).sort({ name: 1 }).select('name specialty bio').lean();
  res.set('Cache-Control', 'public, max-age=60').json(rows);
}));

router.get('/slots', limiter(120, 15 * 60 * 1000), wrap(async (req, res) => {
  const { doctorId, date } = z.object({ doctorId: objectId, date: z.string() }).parse(req.query);
  if (!inBookingWindow(date, config.tz)) return res.json({ slots: [] });
  const doctor = await Doctor.findOne({ _id: doctorId, active: true }).lean();
  if (!doctor) return res.json({ slots: [] });
  const taken = await Appointment.find({ doctorId, date, active: true }).select('time').lean();
  res.json({ slots: availableSlots(doctor, date, new Set(taken.map((a) => a.time)), config.tz) });
}));

const booking = z.object({
  serviceId: objectId,
  doctorId: objectId,
  date: z.string(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time'),
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  phone: z.string().max(20).transform(normalizePhone).refine((p) => /^[6-9]\d{9}$/.test(p), 'Enter a valid 10-digit mobile number'),
  email: z.string().trim().max(120).email('Enter a valid email').optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept the consent to continue' }) }),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

router.post('/appointments', limiter(8, 60 * 60 * 1000), wrap(async (req, res) => {
  const d = booking.parse(req.body);
  const [service, doctor] = await Promise.all([
    Service.findOne({ _id: d.serviceId, active: true }).lean(),
    Doctor.findOne({ _id: d.doctorId, active: true }).lean(),
  ]);
  if (!service || !doctor) return res.status(400).json({ error: 'Please choose a valid service and doctor' });
  if (!inBookingWindow(d.date, config.tz)) return res.status(400).json({ error: 'Please choose a date within the next 60 days' });

  const taken = await Appointment.find({ doctorId: d.doctorId, date: d.date, active: true }).select('time').lean();
  if (!availableSlots(doctor, d.date, new Set(taken.map((a) => a.time)), config.tz).includes(d.time)) {
    return res.status(409).json({ error: 'That time is no longer available. Please choose another.' });
  }

  const reference = newReference();
  await Appointment.create({
    reference,
    nameEnc: encrypt(d.name),
    phoneEnc: encrypt(d.phone),
    phoneHash: blindIndex(d.phone),
    emailEnc: encrypt(d.email),
    notesEnc: encrypt(d.notes),
    serviceId: d.serviceId,
    doctorId: d.doctorId,
    date: d.date,
    time: d.time,
    consentAt: new Date(),
  });
  // Only non-personal details go back to the browser.
  res.status(201).json({ reference, date: d.date, time: d.time, doctor: doctor.name, service: service.name });
}));

export default router;
