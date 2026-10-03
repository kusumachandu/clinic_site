'use client';
// Preselects a treatment and/or doctor in the booking form, then scrolls to it.
export default function PickButton({ serviceId, doctorId, className = 'lm-link', children }) {
  return (
    <button type="button" className={className} onClick={() => {
      window.dispatchEvent(new CustomEvent('lume:pick', { detail: { serviceId, doctorId } }));
      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
    }}>{children}</button>
  );
}
