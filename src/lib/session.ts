const TOKEN_KEY = 'vanguard_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export async function apiRequest(url: string, options: RequestInit = {}, extraHeaders: Record<string, string> = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (res.status === 401) {
    setStoredToken(null);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    const error = new Error(err.error || err.message || `HTTP ${res.status}`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}
