// Browser helper. The login cookie is httpOnly, so scripts never see the session token.
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'X-Requested-With': 'fetch' };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login') && typeof window !== 'undefined') window.location.href = '/admin/login';
    throw new Error(json.error || 'Something went wrong');
  }
  return json;
}
