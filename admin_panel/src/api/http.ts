import { API_BASE_URL } from '../config/env';
import {
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
} from '../auth/session';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<boolean> | null = null;

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.map(String).join(', ');
    if (message != null) return String(message);
  }
  return `Request failed with status ${status}`;
}

async function refreshAccessToken(): Promise<boolean> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          clearSessionTokens();
          return false;
        }

        const body = (await response.json()) as {
          data?: { accessToken?: string; refreshToken?: string };
          accessToken?: string;
          refreshToken?: string;
        };
        const accessToken = body.data?.accessToken ?? body.accessToken;
        const refreshToken = body.data?.refreshToken ?? body.refreshToken;

        if (!accessToken) {
          clearSessionTokens();
          return false;
        }

        setSessionTokens(accessToken, refreshToken);
        return true;
      })
      .catch(() => {
        clearSessionTokens();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry401 = true,
): Promise<T> {
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal ?? controller?.signal;
  const token = getAccessToken();

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    signal,
  });

  const text = await response.text();
  const body = parseBody(text);

  if (response.status === 401 && retry401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, options, false);
  }

  if (!response.ok) {
    const code =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : undefined;

    if (response.status === 401) {
      clearSessionTokens();
      window.dispatchEvent(new CustomEvent('rentease:auth-expired'));
    } else if (response.status === 403) {
      window.dispatchEvent(new CustomEvent('rentease:forbidden'));
    }

    throw new ApiError(getMessage(body, response.status), response.status, code);
  }

  return body as T;
}
