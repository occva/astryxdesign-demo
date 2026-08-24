import {apiErrorMessage, type ApiErrorBody} from '../i18n/api-errors';
import {AuthenticationRequiredError, authApi} from './authApi';
import type {ResourceQuery} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const request = (async () => {
    const send = async (forceRefresh = false) => {
      const token = await authApi.validAccessToken(forceRefresh);
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${token}`);
      if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
      });
    };
    let response = await send();
    if (response.status === 401) {
      try {
        response = await send(true);
      } catch {
        authApi.requireAuthentication();
        throw new AuthenticationRequiredError();
      }
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as ApiErrorBody | null;
      if (response.status === 401) {
        authApi.requireAuthentication();
        throw new AuthenticationRequiredError();
      }
      throw new Error(apiErrorMessage(body, `API request failed with status ${response.status}.`));
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
    if (!response.headers.get('content-type')?.includes('application/json')) return response.text() as Promise<T>;
    return response.json() as Promise<T>;
  })();
  return request;
}

export function resourceQueryString(query: ResourceQuery) {
  const params = new URLSearchParams({page: String(query.page), pageSize: String(query.pageSize)});
  for (const [key, value] of Object.entries(query.filters ?? {})) {
    if (value) params.set(key, value);
  }
  if (query.sortKey) params.set('sortKey', query.sortKey);
  if (query.sortDirection) params.set('sortDirection', query.sortDirection);
  return params.toString();
}
