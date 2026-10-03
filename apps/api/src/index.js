import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config.js';
import { errorHandler, originGuard, sanitize } from './middleware.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.set('trust proxy', config.trustProxy);
app.use(helmet());
app.use(cors({ origin: config.clientOrigins, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(sanitize);
app.use(originGuard);

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

await mongoose.connect(config.mongoUri);
app.listen(config.port, () => console.log(`API ready on port ${config.port}`));
