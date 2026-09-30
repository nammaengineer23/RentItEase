const SENSITIVE_KEY = /(?:authorization|cookie|set-cookie|token|secret|password|passwd|api[-_]?key|private[-_]?key|client[-_]?secret|refresh[-_]?token|access[-_]?token|razorpay|firebase|otp|cvv|card|payment)/i;
const SENSITIVE_VALUE = /(?:bearer\s+)[a-z0-9._~+/-]+=*/gi;

export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[REDACTED]';
  if (typeof value === 'string') return value.replace(SENSITIVE_VALUE, 'Bearer [REDACTED]');
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, depth + 1));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactSensitive(item, depth + 1);
    }
    return output;
  }
  return value;
}

export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost');
    for (const key of ['token', 'access_token', 'refresh_token', 'secret', 'api_key', 'code']) {
      parsed.searchParams.delete(key);
    }
    return parsed.pathname + (parsed.search ? parsed.search : '');
  } catch {
    return url.split('?')[0];
  }
}
