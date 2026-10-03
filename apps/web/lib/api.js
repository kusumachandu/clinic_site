// Server-side fetches for the public pages.
const API_URL = process.env.API_URL || 'http://localhost:4000';

async function get(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
export const getServices = () => get('/api/public/services');
export const getDoctors = () => get('/api/public/doctors');
