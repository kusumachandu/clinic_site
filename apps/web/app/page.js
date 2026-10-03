import './lume.css';
import BookingForm from '@/components/BookingForm';
import Nav from '@/components/site/Nav';
import Effects from '@/components/site/Effects';
import PickButton from '@/components/site/PickButton';
import Finder from '@/components/site/Finder';
import SmileSlider from '@/components/site/SmileSlider';
import Estimator from '@/components/site/Estimator';
import { getDoctors, getServices } from '@/lib/api';
import { clinic, faqs, hoursTable, iconFor, plans, reviews, stats, steps, tech, why } from '@/lib/clinic';

export const dynamic = 'force-dynamic';

const initials = (n) => n.replace('Dr. ', '').split(' ').map((w) => w[0]).join('');
const tints = ['#bfeef4,#dcd5ff', '#dcd5ff,#ffd9c5', '#c9f2dc,#bfeef4', '#ffd9c5,#c9f2dc'];
const Head = ({ eyebrow, children, sub }) => (
  <div className="lm-rv"><p className="lm-eyebrow">{eyebrow}</p><h2>{children}</h2>{sub && <p className="lm-sub">{sub}</p>}</div>
);

export default async function Home() {
  const [services, doctors] = await Promise.all([getServices(), getDoctors()]);
  return (
    <div className="lume" id="top">
      <div className="lm-amb" aria-hidden="true"><i /><i /><i /><i /></div>
      <Nav />
      <Effects />
      <main className="lm-w">
        <section className="lm-hero">
          <div>
            <span className="lm-pill"><b />Same-week appointments available</span>
            <h1>A calmer way to care for your <em>smile</em></h1>
            <p className="lm-lead">Gentle, modern dentistry in a relaxed space. Clear pricing, advanced technology and a team that explains every step before we begin.</p>
            <div className="lm-cta"><a className="lm-btn" href="#book">Book an appointment →</a><a className="lm-btn ghost" href={`tel:${clinic.tel}`}>📞 Call the clinic</a></div>
            <div className="lm-proof">
              <div className="lm-avs">{doctors.slice(0, 4).map((d, i) => <span key={d._id} style={{ background: `linear-gradient(135deg,${tints[i % 4]})` }}>{initials(d.name)}</span>)}</div>
              <span><b>4.9 ★</b> from 2,300+ patient reviews</span>
            </div>
          </div>
          <div className="lm-vis" aria-hidden="true">
            <div className="lm-orb">🦷</div>
            <div className="lm-chip lm-glass c1">Next free slot<small>Book online in 30 seconds</small></div>
            <div className="lm-chip lm-glass c2">98% pain-free visits<small>Painless anaesthesia</small></div>
            <div className="lm-chip lm-glass c3">Hospital-grade sterilisation<small>Every instrument, every visit</small></div>
          </div>
        </section>

        <div className="lm-quick">
          {[['🕘', 'Open 7 days', 'Mon – Fri 9 AM – 9 PM'], ['🚑', 'Dental emergency?', '24/7 helpline'], ['💳', 'Cashless & EMI', 'Insurance, UPI, cards']].map(([i, t, s]) => (
            <div className="lm-glass lm-rv" key={t}><span>{i}</span><div><b>{t}</b><small>{s}</small></div></div>
          ))}
        </div>
        <div className="lm-kpis">
          {stats.map(([n, suf, label]) => <div className="lm-glass lm-rv" key={label}><b><span data-count={n}>{n.toLocaleString('en-IN')}</span>{suf}</b><small>{label}</small></div>)}
        </div>

        <section id="services">
          <Head eyebrow="Treatments" sub="From a routine check-up to a complete smile makeover. Every treatment starts with a clear plan and a fixed price.">Everything your smile needs, <em>under one roof</em></Head>
          <div className="lm-grid g3">
            {services.map((s) => (
              <article className="lm-glass lm-card lm-rv" key={s._id}>
                <div className="lm-ic">{iconFor(s.name)}</div>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <div className="lm-foot"><span className="lm-price">{Number(s.price) ? `From ₹${Number(s.price).toLocaleString('en-IN')}` : 'Call anytime'}</span><PickButton serviceId={s._id}>Book this →</PickButton></div>
              </article>
            ))}
          </div>
          <div className="lm-tech lm-rv">{tech.map((t) => <span key={t}>{t}</span>)}</div>
        </section>

        <section id="tools">
          <Head eyebrow="Smart tools" sub="Not sure where to start? Try these before you book. No sign-up needed.">Plan your visit, <em>your way</em></Head>
          <div className="lm-grid g3">
            <div className="lm-glass lm-toolbox lm-rv"><h3>🧭 Find my treatment</h3><Finder services={services} /></div>
            <div className="lm-glass lm-toolbox lm-rv"><h3>✨ Smile preview</h3><SmileSlider /></div>
            <div className="lm-glass lm-toolbox lm-rv"><h3>💳 Cost &amp; EMI estimator</h3><Estimator services={services} /></div>
          </div>
        </section>

        <section id="why">
          <Head eyebrow="Why Lume">Dentistry designed around <em>you</em></Head>
          <div className="lm-grid g4">{why.map(([i, t, d]) => <div className="lm-glass lm-card lm-rv" key={t}><div className="lm-ic">{i}</div><h3>{t}</h3><p>{d}</p></div>)}</div>
        </section>

        <section id="process">
          <Head eyebrow="How it works">From first call to <em>confident smile</em></Head>
          <div className="lm-grid g4">{steps.map(([n, t, d]) => <div className="lm-glass lm-step lm-rv" key={n}><div className="lm-n">{n}</div><h3>{t}</h3><p>{d}</p></div>)}</div>
        </section>

        <section id="team">
          <Head eyebrow="Our doctors">Meet the people <em>behind the care</em></Head>
          <div className="lm-grid g4">
            {doctors.map((d, i) => (
              <div className="lm-glass lm-doc lm-rv" key={d._id}>
                <div className="lm-av" style={{ background: `linear-gradient(135deg,${tints[i % 4]})` }}>{initials(d.name)}</div>
                <h3>{d.name}</h3><p>{d.specialty}</p><small>{d.bio}</small>
                <PickButton doctorId={d._id}>Book with {d.name.split(' ')[1] || d.name} →</PickButton>
              </div>
            ))}
          </div>
        </section>

        <section id="plans">
          <Head eyebrow="Pricing" sub="Sample pricing. Cashless insurance, EMI options and UPI or card payments are all accepted.">Simple plans, <em>no surprises</em></Head>
          <div className="lm-grid g3">
            {plans.map((p) => (
              <div className={`lm-glass lm-plan lm-rv ${p.pop ? 'pop' : ''}`} key={p.name}>
                {p.pop && <span className="lm-badge">Most popular</span>}
                <h3>{p.name}</h3>
                <div className="lm-pn">{p.price}<small>{p.per}</small></div>
                <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
                <a className="lm-btn" href="#book">Choose {p.name}</a>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews">
          <div className="lm-rv">
            <p className="lm-eyebrow">Patient stories</p>
            <h2>People who stopped <em>hiding their smile</em></h2>
            <div className="lm-rate"><b>4.9</b><div><span className="lm-stars">★★★★★</span><br /><small>Based on 2,300+ reviews</small></div></div>
          </div>
          <div className="lm-snap">
            {reviews.map(([q, n, t]) => <figure className="lm-glass lm-rev" key={n}><span className="lm-stars">★★★★★</span><blockquote>“{q}”</blockquote><figcaption><b>{n}</b><small>{t}</small></figcaption></figure>)}
          </div>
        </section>

        <section id="faq">
          <Head eyebrow="FAQ">Good questions, <em>honest answers</em></Head>
          <div className="lm-faq">{faqs.map(([q, a]) => <details className="lm-glass lm-rv" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </section>

        <section id="book">
          <div className="lm-book lm-glass lm-rv">
            <div>
              <p className="lm-eyebrow">Book online</p>
              <h2>Reserve your visit in <em>30 seconds</em></h2>
              <p className="lm-sub dark">Choose a treatment, a doctor and a time. We confirm by phone within the hour.</p>
              <ul><li>Free first consultation</li><li>Reminders by SMS and WhatsApp</li><li>Reschedule any time, no fee</li><li>Add to your calendar in one tap</li></ul>
            </div>
            <BookingForm services={services} doctors={doctors} />
          </div>
        </section>

        <section id="contact">
          <Head eyebrow="Visit us">Find us, <em>call us</em></Head>
          <div className="lm-contact">
            <div className="lm-glass lm-info lm-rv">
              <div><b>📍 Address</b><span>{clinic.address}<br />Free parking and wheelchair access</span></div>
              <div><b>📞 Phone and WhatsApp</b><a href={`tel:${clinic.tel}`}>{clinic.phone}</a></div>
              <div><b>✉️ Email</b><a href={`mailto:${clinic.email}`}>{clinic.email}</a></div>
              <dl className="lm-hours">{hoursTable.map(([d, h]) => <div key={d}><dt>{d}</dt><dd>{h}</dd></div>)}</dl>
            </div>
            <a className="lm-map lm-rv" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`} target="_blank" rel="noopener noreferrer" aria-label="Open directions in Google Maps"><span>📍</span><b>Get directions →</b></a>
          </div>
        </section>
      </main>

      <footer className="lm-footer lm-w">
        <div><a className="lm-logo" href="#top"><i>🦷</i>Lume Dental</a><p>Advanced dental care with a gentle touch.</p></div>
        <div><b>Treatments</b><a href="#services">All treatments</a><a href="#tools">Smart tools</a><a href="#plans">Pricing</a></div>
        <div><b>Clinic</b><a href="#team">Our doctors</a><a href="#reviews">Reviews</a><a href="#faq">FAQ</a></div>
        <div><b>Contact</b><a href="#contact">Directions</a><a href="#book">Book online</a><a href={`tel:${clinic.tel}`}>Emergency line</a></div>
      </footer>
      <p className="lm-copy">© {new Date().getFullYear()} Lume Dental. <a href="/admin/login">Staff login</a></p>
    </div>
  );
}
