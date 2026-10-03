// Creates the first admin account plus starter services and doctors.
// Safe to run again: nothing is overwritten. Set ADMIN_EMAIL / ADMIN_PASSWORD in .env first.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { Doctor, Service, User } from './models.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD first');
if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

await mongoose.connect(config.mongoUri);
if (!(await User.exists({ email: email.toLowerCase() }))) {
  await User.create({ name: process.env.ADMIN_NAME || 'Clinic Admin', email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
  console.log('Admin account created.');
} else console.log('Admin account already exists, left unchanged.');

if (!(await Service.countDocuments())) {
  await Service.insertMany([
    { name: 'Check-up & cleaning', description: 'Exam, digital X-rays and a professional polish.', price: 500, sortOrder: 1 },
    { name: 'Teeth whitening', description: 'Up to eight shades brighter in one visit.', price: 4500, sortOrder: 2 },
    { name: 'Clear aligners', description: 'Straighter teeth without metal. Includes a 3D smile preview.', price: 90000, sortOrder: 3 },
    { name: 'Dental implants', description: 'A permanent replacement that looks and feels natural.', price: 35000, sortOrder: 4 },
    { name: "Kids' dentistry", description: 'Gentle, playful visits for children.', price: 400, sortOrder: 5 },
    { name: 'Emergency care', description: 'Toothache or a broken tooth. Same-day slots.', price: 800, sortOrder: 6 },
  ]);
}
if (!(await Doctor.countDocuments())) {
  await Doctor.insertMany([
    { name: 'Dr. Anika Rao', specialty: 'Lead dentist', bio: 'General and cosmetic dentistry.', workingDays: [1, 2, 3, 4, 5, 6] },
    { name: 'Dr. Marcus Klein', specialty: 'Orthodontist', bio: 'Braces and clear aligners.', workingDays: [1, 3, 5] },
    { name: 'Dr. Sana Nair', specialty: 'Implant surgeon', bio: 'Implants and oral surgery.', workingDays: [2, 4, 6] },
  ]);
}
console.log('Seed complete.');
await mongoose.disconnect();
