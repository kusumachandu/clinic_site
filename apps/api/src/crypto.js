import crypto from 'node:crypto';
import { config } from './config.js';

// Field-level encryption (AES-256-GCM). Patient details are stored as ciphertext,
// so a leaked database dump or backup does not expose names, phones or notes.
const indexKey = Buffer.from(crypto.hkdfSync('sha256', config.encKey, Buffer.alloc(0), 'phone-index-v1', 32));

export function encrypt(text) {
  if (text == null || text === '') return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', config.encKey, iv);
  const enc = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload) {
  if (!payload) return '';
  const [iv, tag, enc] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', config.encKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

// Lets staff search by phone number without storing the number in plain text.
export const blindIndex = (value) => crypto.createHmac('sha256', indexKey).update(String(value)).digest('hex');
export const newReference = () => crypto.randomBytes(4).toString('hex').toUpperCase();

export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}
