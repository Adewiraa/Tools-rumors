/**
 * authSession.ts
 * ─────────────────────────────────────────────────────────────────
 * Lightweight client-side session management using localStorage.
 * No JWT — just a plain JSON object keyed by SESSION_KEY.
 * All functions are safe to call on the server (they guard with typeof window).
 */

import type { AppUser } from '@/lib/types/auth';

const SESSION_KEY = 'gosball_session';
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export interface SessionData {
  user: Omit<AppUser, 'password'>;
  loginAt: string; // ISO timestamp
  lastActivityAt?: string; // ISO timestamp
}

/** Save a user session after successful login. */
export function saveSession(user: Omit<AppUser, 'password'>): void {
  if (typeof window === 'undefined') return;
  const now = new Date().toISOString();
  const session: SessionData = {
    user,
    loginAt: now,
    lastActivityAt: now,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function isSessionExpired(session: SessionData): boolean {
  const lastActivity = Date.parse(session.lastActivityAt || session.loginAt);
  if (!Number.isFinite(lastActivity)) return true;
  return Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS;
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
    if (isSessionExpired(parsed)) {
      clearSession();
      return null;
    }
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

/** Refresh the session activity timestamp after a real user interaction. */
export function touchSession(): void {
  if (typeof window === 'undefined') return;
  const session = getSession();
  if (!session) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    ...session,
    lastActivityAt: new Date().toISOString(),
  }));
}

/** Get the logged-in user. Returns null if not logged in. */
export function getSessionUser(): Omit<AppUser, 'password'> | null {
  return getSession()?.user ?? null;
}
