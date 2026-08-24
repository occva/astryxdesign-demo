import type {AuthSession} from '../types';
import {apiErrorMessage, type ApiErrorBody} from '../i18n/api-errors';
import i18n from '../i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const SESSION_STORAGE_KEY = 'kumo-admin-session';
const REMEMBERED_LOGIN_STORAGE_KEY = 'kumo-admin-remembered-login';
export const AUTH_REQUIRED_EVENT = 'kumo-admin-auth-required';
let pendingSessionRequest: Promise<AuthSession | null> | null = null;
let pendingRefreshRequest: Promise<AuthSession> | null = null;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication required.');
    this.name = 'AuthenticationRequiredError';
  }
}

function readStoredSession(): {session: AuthSession; persistent: boolean} | null {
  if (typeof window === 'undefined') return null;
  const persistentRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  const raw = persistentRaw ?? window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return {session: JSON.parse(raw) as AuthSession, persistent: Boolean(persistentRaw)};
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function storeSession(session: AuthSession | null, persistent = false) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  if (!session) return;
  const storage = persistent ? window.localStorage : window.sessionStorage;
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function readRememberedLogin(): {account: string} | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(REMEMBERED_LOGIN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as {account?: unknown; password?: unknown};
    if (typeof value.account === 'string') {
      if ('password' in value) storeRememberedLogin(value.account);
      return {account: value.account};
    }
  } catch {
    // Invalid remembered credentials are removed below.
  }
  window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
  return null;
}

function storeRememberedLogin(account: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    REMEMBERED_LOGIN_STORAGE_KEY,
    JSON.stringify({account}),
  );
}

function clearRememberedLogin() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
}

function requireAuthentication() {
  pendingSessionRequest = null;
  pendingRefreshRequest = null;
  storeSession(null);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
}

function mergeSession(session: AuthSession, previous?: AuthSession) {
  return {
    ...session,
    refreshToken: session.refreshToken || previous?.refreshToken || '',
  };
}

function expiresSoon(session: AuthSession) {
  return !session.expiresAt || session.expiresAt <= Math.floor(Date.now() / 1000) + 60;
}

async function refreshStoredSession() {
  if (pendingRefreshRequest) return pendingRefreshRequest;
  const stored = readStoredSession();
  if (!stored?.session.refreshToken) {
    requireAuthentication();
    throw new AuthenticationRequiredError();
  }
  pendingRefreshRequest = (async () => {
    try {
      const session = await request<AuthSession>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({refreshToken: stored.session.refreshToken}),
      }, false);
      storeSession(session, stored.persistent);
      return session;
    } catch {
      requireAuthentication();
      throw new AuthenticationRequiredError();
    } finally {
      pendingRefreshRequest = null;
    }
  })();
  return pendingRefreshRequest;
}

async function request<T>(path: string, init?: RequestInit, redirectOnUnauthorized = true): Promise<T> {
  const requestUrl = `${API_BASE_URL}${path}`;
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const resolvedUrl = new URL(requestUrl, window.location.origin);
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(resolvedUrl.hostname);
    if (resolvedUrl.protocol !== 'https:' && !isLocal) {
      throw new Error(i18n.t('auth:insecureTransport'));
    }
  }
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const response = await fetch(requestUrl, {
    ...init,
    headers: {...(isFormData ? {} : {'Content-Type': 'application/json'}), ...init?.headers},
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as ApiErrorBody | null;
    if (response.status === 401 && redirectOnUnauthorized) {
      requireAuthentication();
      throw new AuthenticationRequiredError();
    }
    throw new Error(apiErrorMessage(body, `Authentication failed with status ${response.status}.`));
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  rememberedLogin() {
    return readRememberedLogin();
  },

  forgetRememberedLogin() {
    clearRememberedLogin();
  },

  accessToken() {
    return readStoredSession()?.session.token;
  },

  async validAccessToken(forceRefresh = false) {
    const stored = readStoredSession();
    if (!stored) {
      requireAuthentication();
      throw new AuthenticationRequiredError();
    }
    if (forceRefresh || expiresSoon(stored.session)) return (await refreshStoredSession()).token;
    return stored.session.token;
  },

  async login(account: string, password: string, remember = false) {
    const session = await request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({account, password}),
    }, false);
    storeSession(session, remember);
    if (remember) storeRememberedLogin(account.trim());
    else clearRememberedLogin();
    return session;
  },

  async register(input: {name: string; account: string; email?: string; password: string}, remember = false) {
    const session = await request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }, false);
    storeSession(session, remember);
    return session;
  },

  async getSession() {
    if (pendingSessionRequest) return pendingSessionRequest;
    const stored = readStoredSession();
    if (!stored) return null;
    pendingSessionRequest = (async () => {
      try {
        if (expiresSoon(stored.session)) return await refreshStoredSession();
        const session = await request<AuthSession>('/auth/session', {
          headers: {Authorization: `Bearer ${stored.session.token}`},
        }, false);
        const merged = mergeSession(session, stored.session);
        storeSession(merged, stored.persistent);
        return merged;
      } catch {
        try {
          return await refreshStoredSession();
        } catch {
          storeSession(null);
          return null;
        }
      } finally {
        pendingSessionRequest = null;
      }
    })();
    return pendingSessionRequest;
  },

  async updateProfile(patch: {
    name: string;
    email: string;
    phone: string;
    employeeNo: string;
    jobTitle: string;
    managerName: string;
    enterpriseWechat: string;
    emergencyContact: string;
    officeLocation: string;
    joinedAt: string;
  }) {
    const stored = readStoredSession();
    if (!stored) {
      requireAuthentication();
      throw new AuthenticationRequiredError();
    }
    const token = await this.validAccessToken();
    const session = await request<AuthSession>('/auth/profile', {
      method: 'POST',
      headers: {Authorization: `Bearer ${token}`},
      body: JSON.stringify(patch),
    });
    const merged = mergeSession(session, stored.session);
    storeSession(merged, stored.persistent);
    return merged;
  },

  async updateAvatar(file:File) {
    const stored=readStoredSession();
    if(!stored){requireAuthentication();throw new AuthenticationRequiredError();}
    const token=await this.validAccessToken();
    const body=new FormData();
    body.append('file',file);
    const session=await request<AuthSession>('/auth/avatar',{method:'POST',headers:{Authorization:`Bearer ${token}`},body});
    const merged=mergeSession(session,stored.session);
    storeSession(merged,stored.persistent);
    return merged;
  },

  async changePassword(password: string) {
    const token = await this.validAccessToken();
    await request<void>('/auth/password', {
      method: 'POST',
      headers: {Authorization: `Bearer ${token}`},
      body: JSON.stringify({password}),
    });
  },

  async logout() {
    const stored = readStoredSession();
    try {
      if (stored) {
        const token = await this.validAccessToken();
        await request<void>('/auth/logout', {
          method: 'POST',
          headers: {Authorization: `Bearer ${token}`},
        }, false);
      }
    } catch {
      // Local credentials must still be removed when the remote session is already invalid.
    } finally {
      pendingRefreshRequest = null;
      storeSession(null);
    }
  },

  requireAuthentication,
};
