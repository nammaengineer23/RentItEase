let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setSessionTokens(nextAccessToken: string, nextRefreshToken?: string | null): void {
  accessToken = nextAccessToken;
  refreshToken = nextRefreshToken ?? null;
}

export function clearSessionTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export function hasSession(): boolean {
  return accessToken !== null;
}
