import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
  hasSession,
  setSessionTokens,
} from '../src/auth/session';

describe('admin session lifecycle', () => {
  beforeEach(() => {
    clearSessionTokens();
  });

  it('starts logged out', () => {
    expect(hasSession()).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('stores access and refresh tokens only in memory', () => {
    setSessionTokens('access-token', 'refresh-token');

    expect(hasSession()).toBe(true);
    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');
  });

  it('clears the complete session on logout', () => {
    setSessionTokens('access-token', 'refresh-token');

    clearSessionTokens();

    expect(hasSession()).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('allows access-only sessions when the refresh token is absent', () => {
    setSessionTokens('access-token');

    expect(hasSession()).toBe(true);
    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBeNull();
  });
});
