process.env.MONGODB_URI = 'mongodb://x/y';
process.env.JWT_SECRET = 'a'.repeat(40);
process.env.ENCRYPTION_KEY = 'b'.repeat(64);
import test from 'node:test';
import assert from 'node:assert/strict';

const { encrypt, decrypt, blindIndex, normalizePhone } = await import('../src/crypto.js');
const { generateSlots, availableSlots, isRealDate } = await import('../src/slots.js');
const { sanitize } = await import('../src/middleware.js');

test('encrypt/decrypt round trip and randomised ciphertext', () => {
  const a = encrypt('Ravi Kumar'), b = encrypt('Ravi Kumar');
  assert.notEqual(a, b);
  assert.equal(decrypt(a), 'Ravi Kumar');
  assert.equal(encrypt(''), '');
});

test('tampered ciphertext is rejected', () => {
  const parts = encrypt('secret').split('.');
  parts[2] = Buffer.from('tampered').toString('base64');
  assert.throws(() => decrypt(parts.join('.')));
});

test('phone normalising and blind index', () => {
  assert.equal(normalizePhone('+91 98765-43210'), '9876543210');
  assert.equal(normalizePhone('098765 43210'), '9876543210');
  assert.equal(blindIndex('9876543210'), blindIndex(normalizePhone('+919876543210')));
  assert.notEqual(blindIndex('9876543210'), blindIndex('9876543211'));
});

test('slot generation respects working days and slot length', () => {
  const doc = { workingDays: [1], startTime: '10:00', endTime: '11:30', slotMinutes: 30 };
  assert.deepEqual(generateSlots(doc, '2030-01-07'), ['10:00', '10:30', '11:00']); // a Monday
  assert.deepEqual(generateSlots(doc, '2030-01-08'), []);                          // a Tuesday
  assert.deepEqual(availableSlots(doc, '2030-01-07', new Set(['10:30']), 'Asia/Kolkata'), ['10:00', '11:00']);
  assert.deepEqual(availableSlots(doc, '2000-01-03', new Set(), 'Asia/Kolkata'), []);
});

test('date validation', () => {
  assert.equal(isRealDate('2030-02-30'), false);
  assert.equal(isRealDate('2030-02-28'), true);
});

test('sanitize blocks mongo operators', () => {
  const run = (body) => { let out = 'next'; sanitize({ body, query: {}, params: {} }, { status: () => ({ json: () => { out = 'blocked'; } }) }, () => {}); return out; };
  assert.equal(run({ email: { $gt: '' } }), 'blocked');
  assert.equal(run({ 'a.b': 1 }), 'blocked');
  assert.equal(run({ email: 'x@y.z' }), 'next');
});
