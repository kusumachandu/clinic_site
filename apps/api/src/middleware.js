import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { config } from './config.js';
import { AuditLog, User } from './models.js';

export const COOKIE = 'clinic_token';
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const cookieOptions = {
  httpOnly: true,                 // not readable by page scripts
  secure: config.prod,            // HTTPS only in production
  sameSite: 'strict',             // never sent on cross-site requests
  path: '/',
};

// Reject MongoDB operator injection such as {"email":{"$gt":""}}
export function sanitize(req, res, next) {
  const bad = (o) => o && typeof o === 'object' && Object.keys(o).some((k) => k.startsWith('$') || k.includes('.') || bad(o[k]));
  if (bad(req.body) || bad(req.query) || bad(req.params)) return res.status(400).json({ error: 'Invalid input' });
  next();
}

// CSRF defence in depth: browsers always send Origin on cross-site writes.
export function originGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !config.clientOrigins.includes(origin)) return res.status(403).json({ error: 'Forbidden origin' });
  next();
}

export function requireHeader(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.headers['x-requested-with'] !== 'fetch') return res.status(403).json({ error: 'Missing request header' });
  next();
}

export const requireAuth = (...roles) => wrap(async (req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'Please log in' });
  let payload;
  try { payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }); }
  catch { return res.status(401).json({ error: 'Session expired. Please log in again.' }); }
  // Re-check the account on every request so disabled staff lose access immediately.
  const user = await User.findById(payload.sub).select('name email role active');
  if (!user || !user.active) return res.status(401).json({ error: 'Account disabled' });
  if (roles.length && !roles.includes(user.role)) return res.status(403).json({ error: 'You do not have permission for this' });
  req.user = user;
  next();
});

export const audit = (req, action, entity, entityId) =>
  AuditLog.create({ userId: req.user?._id, email: req.user?.email, action, entity, entityId: entityId ? String(entityId) : undefined, ip: req.ip }).catch(() => {});

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({ error: first?.message || 'Invalid data', field: first?.path?.join('.') });
  }
  if (err.code === 11000) return res.status(409).json({ error: 'That slot was just taken. Please choose another time.' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
}
