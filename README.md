# Lume Clinic: website, booking and secure admin panel

Monorepo (npm workspaces):

```
apps/api   Express + MongoDB (Mongoose): public booking API, staff auth, admin API
apps/web   Next.js 14: clinic website with online booking, plus the staff admin panel
```

Patients book online. Appointments are stored in MongoDB with the patient's personal details
**encrypted**. Staff log in at `/admin` to see, confirm, complete or cancel appointments.
Admins also manage doctors, services, staff accounts and read the activity log.

## Run locally

Requirements: Node 20+ and MongoDB (Docker, a local install, or a free Atlas cluster).

```bash
npm install
npm run keys                     # prints JWT_SECRET and ENCRYPTION_KEY: copy them into apps/api/.env
docker compose up -d mongo       # skip if you use Atlas
copy apps\api\.env.example apps\api\.env      # Windows   (macOS/Linux: cp)
copy apps\web\.env.example apps\web\.env.local
npm run seed                     # creates your admin account, 6 services, 3 doctors
npm run dev                      # API :4000, web :3000
npm test                         # unit tests for encryption, slots and input filtering
```

Website: http://localhost:3000   Admin: http://localhost:3000/admin/login

## How it is secured

| Risk | What this project does |
|---|---|
| Database leak or stolen backup | Patient name, phone, email and notes are encrypted with AES-256-GCM before they reach MongoDB. Phone search uses a keyed hash, so numbers are never stored in plain text. |
| Stolen passwords | Passwords are hashed with bcrypt (cost 12). Minimum 12 characters for staff accounts. |
| Session theft | Login uses an `httpOnly`, `Secure`, `SameSite=Strict` cookie. Page scripts cannot read it. Sessions last 8 hours and staff are signed out after 15 idle minutes. |
| Cross-site request forgery | `SameSite=Strict`, an Origin allow-list, and a required custom header on every write. |
| Password guessing | Rate limits plus a 15-minute account lock after 5 failed logins. Equal response time for unknown emails. |
| NoSQL injection | Input validated with zod and any key starting with `$` or containing `.` is rejected. |
| Double booking | A unique database index on doctor + date + time for live appointments. |
| Bots | Strict booking rate limit (8 per hour per IP) and a hidden honeypot field. |
| Over-sharing | The booking response returns no personal data. Staff see only what their role allows. |
| Insider misuse | An activity log records who viewed or changed appointment data, and every login. |
| Disabled staff | The account is checked in the database on every request, so disabling it takes effect immediately. |
| Browser attacks | Helmet on the API, security headers (HSTS, frame, sniffing, referrer) on the web app. Admin pages are `noindex` and `no-store`. |

## Deploy

1. **MongoDB Atlas:** create a cluster, a database user and copy the connection string (add `/lume_clinic`).
2. **API on Render** (Root Directory `apps/api`, build `npm install`, start `npm start`). Set
   `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`, `CLIENT_ORIGIN` (your web URL),
   `TRUST_PROXY_HOPS=2` (web proxy plus Render's load balancer), `CLINIC_TZ`.
3. **Web on Vercel** (Root Directory `apps/web`). Set `API_URL` to the Render URL, no trailing slash.
4. Run `npm run seed` once with your production `MONGODB_URI` and a strong `ADMIN_PASSWORD`.
5. Open `/admin/login` and add your team under **Staff**.

## Before using this with real patients

- **Back up `ENCRYPTION_KEY` somewhere safe and separate.** Without it the patient data cannot be read, and anyone who has it plus the database can read everything. Do not commit it.
- Turn on **automated backups** in Atlas and restrict database network access where you can.
- Health data is sensitive personal data. India's Digital Personal Data Protection Act (2023) expects clear
  consent, a stated purpose, data retention limits, a way to correct or erase data, and a plan for reporting
  breaches. Have a lawyer review your privacy notice and retention policy before launch.
- Add a Privacy Policy page and link it in the footer.
- Use a real HTTPS domain. The secure cookie will not work over plain HTTP in production.
- This build uses a single clinic. For several clinics, add a `clinicId` to every collection.
- Not included yet: SMS/WhatsApp confirmations, payments, patient records, two-factor login. These are good next steps.
