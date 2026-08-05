/**
 * Product Launch OS - Session Lifetime Manager (7-Day Persistent Session)
 */

const STORAGE_KEY_SESSION_EXPIRY = 'mix_pro_session_expiry_v1';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export function initOrRefreshSession(): number {
  try {
    const now = Date.now();
    const existing = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRY);

    if (existing) {
      const expiry = parseInt(existing, 10);
      // If session is still valid (within 7 days), extend/keep it
      if (expiry > now) {
        return expiry;
      }
    }

    // Set new 7-day session expiry
    const newExpiry = now + SESSION_DURATION_MS;
    localStorage.setItem(STORAGE_KEY_SESSION_EXPIRY, String(newExpiry));
    return newExpiry;
  } catch (err) {
    console.warn('Session storage write error:', err);
    return Date.now() + SESSION_DURATION_MS;
  }
}

export function getSessionRemainingDays(): number {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRY);
    if (!existing) return 7;
    const expiry = parseInt(existing, 10);
    const diffMs = expiry - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  } catch {
    return 7;
  }
}

export function isSessionExpired(): boolean {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRY);
    if (!existing) return false;
    const expiry = parseInt(existing, 10);
    return Date.now() > expiry;
  } catch {
    return false;
  }
}

export function resetSessionSevenDays(): void {
  try {
    const newExpiry = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem(STORAGE_KEY_SESSION_EXPIRY, String(newExpiry));
  } catch (err) {
    console.warn('Session reset error:', err);
  }
}
