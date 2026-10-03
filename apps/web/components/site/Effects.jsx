'use client';
import { useEffect, useState } from 'react';
import { clinic } from '@/lib/clinic';

// Scroll progress, reveal-on-scroll, animated counters and the floating action buttons.
export default function Effects() {
  const [pct, setPct] = useState(0);
  const [top, setTop] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('lm-js');
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0);
      setTop(window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = (el) => {
      const end = Number(el.dataset.count), dec = end % 1 ? 1 : 0, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1400), v = end * (1 - Math.pow(1 - p, 3));
        el.textContent = dec ? v.toFixed(1) : Math.round(v).toLocaleString('en-IN');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => entries.forEach((x) => {
      if (!x.isIntersecting) return;
      x.target.classList.add('in');
      if (!reduce) x.target.querySelectorAll('[data-count]').forEach(count);
      io.unobserve(x.target);
    }), { threshold: 0.08 });
    document.querySelectorAll('.lm-rv').forEach((el) => io.observe(el));
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect(); };
  }, []);

  return (
    <>
      <div className="lm-progress" style={{ width: `${pct}%` }} aria-hidden="true" />
      <a className="lm-wa" href={`https://wa.me/${clinic.whatsapp}?text=Hi%20Lume%20Dental%2C%20I%27d%20like%20to%20book%20an%20appointment`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">💬</a>
      {top && <button type="button" className="lm-up" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>}
      <div className="lm-sticky"><a className="lm-btn ghost" href={`tel:${clinic.tel}`}>📞 Call</a><a className="lm-btn" href="#book">Book appointment</a></div>
    </>
  );
}
