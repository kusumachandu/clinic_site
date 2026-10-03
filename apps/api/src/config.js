import 'dotenv/config';

const need = (key) => {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
  return process.env[key];
};

const jwtSecret = need('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
const encHex = need('ENCRYPTION_KEY');
if (!/^[a-f0-9]{64}$/i.test(encHex)) throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes). Run: npm run keys');

export const config = {
  port: Number(process.env.PORT) || 4000,
  prod: process.env.NODE_ENV === 'production',
  mongoUri: need('MONGODB_URI'),
  jwtSecret,
  encKey: Buffer.from(encHex, 'hex'),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()),
  trustProxy: Number(process.env.TRUST_PROXY_HOPS ?? 0),
  tz: process.env.CLINIC_TZ || 'Asia/Kolkata',
};
