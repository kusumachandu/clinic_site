import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { User, AuditLog } from '../models.js';
import { COOKIE, cookieOptions, requireAuth, requireHeader, wrap, audit } from '../middleware.js';

const router = Router();
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12); // keeps timing equal for unknown emails
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again later.' } });

router.post('/login', requireHeader, loginLimiter, wrap(async (req, res) => {
  const { email, password } = z.object({ email: z.string().email().max(120), password: z.string().min(1).max(200) }).parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() });
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

  if (user?.lockUntil && user.lockUntil > new Date()) {
    return res.status(423).json({ error: 'Too many failed attempts. This account is locked for 15 minutes.' });
  }
  if (!user || !user.active || !ok) {
    if (user) {
      user.failedLogins += 1;
      if (user.failedLogins >= MAX_FAILS) { user.lockUntil = new Date(Date.now() + LOCK_MS); user.failedLogins = 0; }
      await user.save();
    }
    await AuditLog.create({ email: email.toLowerCase(), action: 'login.failed', ip: req.ip }).catch(() => {});
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  user.failedLogins = 0;
  user.lockUntil = null;
  await user.save();
  const token = jwt.sign({ sub: String(user._id) }, config.jwtSecret, { algorithm: 'HS256', expiresIn: '8h' });
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  req.user = user;
  await audit(req, 'login.success', 'user', user._id);
  res.json({ user: { name: user.name, email: user.email, role: user.role } });
}));

router.post('/logout', requireHeader, (req, res) => {
  res.clearCookie(COOKIE, cookieOptions);
  res.json({ ok: true });
});

router.get('/me', requireAuth(), (req, res) => {
  res.json({ user: { name: req.user.name, email: req.user.email, role: req.user.role } });
});

export default router;
