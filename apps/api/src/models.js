import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ACTIVE = ['pending', 'confirmed'];
export const isActiveStatus = (s) => ACTIVE.includes(s);

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  active: { type: Boolean, default: true },
  failedLogins: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true }));

export const Service = model('Service', new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 100 },
}, { timestamps: true }));

export const Doctor = model('Doctor', new Schema({
  name: { type: String, required: true, trim: true },
  specialty: { type: String, default: '' },
  bio: { type: String, default: '' },
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0 = Sunday
  startTime: { type: String, default: '10:00' },
  endTime: { type: String, default: '18:00' },
  slotMinutes: { type: Number, default: 30, min: 10, max: 120 },
  active: { type: Boolean, default: true },
}, { timestamps: true }));

const appointmentSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  // personal data is encrypted; phoneHash is a keyed hash used only for search
  nameEnc: { type: String, required: true },
  phoneEnc: { type: String, required: true },
  phoneHash: { type: String, required: true, index: true },
  emailEnc: { type: String, default: '' },
  notesEnc: { type: String, default: '' },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD, clinic time zone
  time: { type: String, required: true },              // HH:MM
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'pending' },
  active: { type: Boolean, default: true },            // true while pending or confirmed
  consentAt: { type: Date, required: true },
}, { timestamps: true });
// A doctor's slot can hold only one live appointment, enforced by the database itself.
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { active: true } });
export const Appointment = model('Appointment', appointmentSchema);

export const AuditLog = model('AuditLog', new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  email: String,
  action: { type: String, required: true },
  entity: String,
  entityId: String,
  ip: String,
}, { timestamps: { createdAt: true, updatedAt: false } }));
