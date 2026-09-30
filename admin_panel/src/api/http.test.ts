import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest, ApiError } from './http';
import { clearSessionTokens, setSessionTokens } from '../auth/session';

describe('admin API security client', () => {
  beforeEach(() => {
    clearSessionTokens();
    vi.restoreAllMocks();
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    });
  });

  it('maps 403 responses to a permission error and emits the forbidden event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    await expect(apiRequest('/admin/users')).rejects.toMatchObject({
      status: 403,
      message: 'You do not have permission to perform this action.',
    } satisfies Partial<ApiError>);

    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('does not retry a mutating request after 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    setSessionTokens('access', 'refresh');

    await expect(
      apiRequest('/admin/users/1', {
        method: 'DELETE',
        body: JSON.stringify({}),
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries an idempotent GET once after a successful refresh', async () => {
    setSessionTokens('expired-access', 'refresh-token');

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ data: { ok: true } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/admin/dashboard')).resolves.toEqual({
      data: { ok: true },
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
