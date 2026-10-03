// Clinic details and marketing copy for the public site. Replace the placeholders with real ones.
export const clinic = {
  name: 'Lume Dental',
  phone: '+91 00000 00000',
  tel: '+910000000000',
  whatsapp: '910000000000',
  email: 'hello@lumedental.com',
  address: '24 Garden Road, Your City, 000000',
  // Opening hours, 24h clock, indexed by getDay() (0 = Sunday).
  hours: [[10, 14], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21], [10, 18]],
  tz: 'Asia/Kolkata',
};

export const hoursTable = [['Mon – Fri', '9 AM – 9 PM'], ['Saturday', '10 AM – 6 PM'], ['Sunday', '10 AM – 2 PM'], ['Emergency', '24 / 7 helpline']];

export const stats = [[15, '+', 'Years of experience'], [2300, '+', 'Happy patients'], [12, '', 'Specialists'], [4.9, '★', 'Average rating']];

export const why = [
  ['💧', 'Painless by design', 'Modern anaesthesia and a slow, gentle technique.'],
  ['🧼', 'Hospital-grade hygiene', 'Sterilised instruments sealed in front of you.'],
  ['🧾', 'Transparent pricing', 'A written estimate before any treatment starts.'],
  ['🕊️', 'Anxiety-friendly', 'Calm music, breaks on request and clear explanations.'],
];

export const steps = [
  ['1', 'Book', 'Choose a time online or by phone in under a minute.'],
  ['2', 'Consult & scan', 'A friendly exam with digital X-rays and 3D scanning.'],
  ['3', 'Plan & price', 'You see the plan, timeline and exact cost first.'],
  ['4', 'Treat & follow up', 'Comfortable treatment, then reminders and check-ins.'],
];

export const tech = ['3D intraoral scanner', 'Digital X-ray', 'Laser dentistry', 'Painless anaesthesia', 'Same-day crowns', 'Smile design software'];

export const plans = [
  { name: 'Essential', price: '₹799', per: '', items: ['Dental exam', 'Digital X-rays', 'Professional cleaning'] },
  { name: 'Bright smile', price: '₹5,499', per: '', items: ['Everything in Essential', 'In-clinic whitening', 'Take-home touch-up kit'], pop: true },
  { name: 'Family plan', price: '₹1,499', per: ' / month', items: ['Up to 4 members', 'Two check-ups each per year', '15% off all treatments'] },
];

export const reviews = [
  ['I hadn’t seen a dentist in years. They were kind, explained everything and I felt nothing.', 'Priya S.', 'Check-up & cleaning'],
  ['The aligner preview looked so real that I signed up on the spot. Six months in, it is spot on.', 'Daniel O.', 'Clear aligners'],
  ['My son asked when he can go back. I never thought I would hear that.', 'Meera T.', 'Kids’ dentistry'],
  ['Got my crown fitted in a single day. The whole team was calm, quick and very clear about cost.', 'Rahul V.', 'Same-day crown'],
];

export const faqs = [
  ['Does treatment hurt?', 'We numb the area first and work slowly. Most patients tell us it was easier than expected.'],
  ['Do you accept insurance?', 'Yes. We work with most major plans and handle cashless claims for you.'],
  ['How soon can I get an appointment?', 'Usually within the week. Emergency slots are held open every day.'],
  ['Can I pay in instalments?', 'Yes. Treatments above ₹5,000 can be split into 3, 6 or 12 monthly payments.'],
  ['What should I bring to my first visit?', 'Any previous X-rays or reports, and a list of medicines you take. We will handle the rest.'],
  ['Is it safe for children?', 'Absolutely. Our paediatric dentist uses child-friendly techniques and plenty of patience.'],
];

// Maps a treatment name to an icon and to the symptom finder.
export const iconFor = (name = '') => {
  const n = name.toLowerCase();
  if (/whiten|bleach/.test(n)) return '✨';
  if (/check|clean|scal|polish/.test(n)) return '🩺';
  if (/align|brace|ortho/.test(n)) return '😁';
  if (/implant/.test(n)) return '🔩';
  if (/kid|child|paed|pedi/.test(n)) return '🧒';
  if (/emerg|pain|urgent/.test(n)) return '⚡';
  if (/root|canal/.test(n)) return '🦷';
  if (/crown|cap|veneer/.test(n)) return '👑';
  return '🦷';
};
