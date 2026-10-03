// Small shared helpers for the admin screens.
export const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
export const label = (s) => s.replace('_', ' ');
export const todayStr = () => new Date().toLocaleDateString('en-CA');
export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
export const initials = (n = '') => n.replace(/^Dr\.\s*/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
export const niceDate = (d) => new Date(`${d}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const pct = (n) => `${Math.round((n || 0) * 100)}%`;

export function Avatar({ name }) { return <span className="ad-av" aria-hidden="true">{initials(name)}</span>; }
export function StatusPill({ status }) { return <span className={`ad-st ${status}`}>{label(status)}</span>; }

// Percentage change against the previous period, with an arrow and words so it never relies on colour alone.
export function Delta({ now, before }) {
  if (!before && !now) return <small className="ad-delta">no change</small>;
  if (!before) return <small className="ad-delta up">▲ new</small>;
  const d = ((now - before) / before) * 100;
  if (Math.abs(d) < 0.5) return <small className="ad-delta">no change</small>;
  return <small className={`ad-delta ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? '▲' : '▼'} {Math.abs(Math.round(d))}% vs previous</small>;
}
