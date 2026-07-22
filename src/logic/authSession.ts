/**
 * authSession.ts
 * ─────────────────────────────────────────────────────────────────
 * Lightweight client-side session management using localStorage.
 * No JWT — just a plain JSON object keyed by SESSION_KEY.
 * All functions are safe to call on the server (they guard with typeof window).
 */

import type { AppUser } from '@/lib/types/auth';

const SESSION_KEY = 'gosball_session';

export interface SessionData {
  user: Omit<AppUser, 'password'>;
  loginAt: string; // ISO timestamp
}

/** Save a user session after successful login. */
export function saveSession(user: Omit<AppUser, 'password'>): void {
  if (typeof window === 'undefined') return;
  const session: SessionData = {
    user,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Read the current session. Returns null if not logged in. */
export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionData;
    // Basic validation
    if (!parsed?.user?.id || !parsed?.user?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Check whether a valid session exists. */
export function isLoggedIn(): boolean {
  return getSession() !== null;
}

/** Remove the session (logout). */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

/** Get the logged-in user. Returns null if not logged in. */
export function getSessionUser(): Omit<AppUser, 'password'> | null {
  return getSession()?.user ?? null;
}
