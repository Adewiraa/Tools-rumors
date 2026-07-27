/**
 * Lightweight client-side session management using sessionStorage.
 * Sessions are per browser tab, so two different admin accounts can keep
 * separate media identities without overwriting each other.
 */

import type { AppUser } from '@/lib/types/auth';

const SESSION_KEY = 'gosball_session';
const ACTIVE_TENANT_KEY = 'gosball_active_tenant';
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export interface SessionData {
  user: Omit<AppUser, 'password'>;
  loginAt: string;
  lastActivityAt?: string;
}

function getSessionStore(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function isSessionExpired(session: SessionData): boolean {
  const lastActivity = Date.parse(session.lastActivityAt || session.loginAt);
  if (!Number.isFinite(lastActivity)) return true;
  return Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS;
}

/** Save a user session after successful login. */
export function saveSession(user: Omit<AppUser, 'password'>): void {
  if (typeof window === 'undefined') return;
  const store = getSessionStore();
  if (!store) return;

  const now = new Date().toISOString();
  const session: SessionData = {
    user,
    loginAt: now,
    lastActivityAt: now,
  };

  store.setItem(SESSION_KEY, JSON.stringify(session));
  store.setItem(ACTIVE_TENANT_KEY, user.tenantId || 'gosball');
  window.localStorage.removeItem(SESSION_KEY);
}

/** Read the current session. Returns null if not logged in. */
export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  const store = getSessionStore();
  if (!store) return null;

  try {
    const raw = store.getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SessionData;
    if (!parsed?.user?.id || !parsed?.user?.username) return null;

    if (isSessionExpired(parsed)) {
      clearSession();
      return null;
    }

    if (!store.getItem(SESSION_KEY)) {
      store.setItem(SESSION_KEY, JSON.stringify(parsed));
      window.localStorage.removeItem(SESSION_KEY);
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
  window.sessionStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(ACTIVE_TENANT_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(ACTIVE_TENANT_KEY);
}

/** Refresh the session activity timestamp after a real user interaction. */
export function touchSession(): void {
  if (typeof window === 'undefined') return;
  const session = getSession();
  const store = getSessionStore();
  if (!session || !store) return;

  store.setItem(SESSION_KEY, JSON.stringify({
    ...session,
    lastActivityAt: new Date().toISOString(),
  }));
}

/** Get the logged-in user. Returns null if not logged in. */
export function getSessionUser(): Omit<AppUser, 'password'> | null {
  return getSession()?.user ?? null;
}

export function getActiveTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACTIVE_TENANT_KEY);
}

export function setActiveTenantId(tenantId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
}
