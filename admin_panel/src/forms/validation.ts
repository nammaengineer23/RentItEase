export function requiredText(value: string, label: string, maxLength = 200): string | null {
  const normalized = value.trim();
  if (!normalized) return `${label} is required.`;
  if (normalized.length > maxLength) return `${label} must be ${maxLength} characters or fewer.`;
  return null;
}

export function positiveNumber(value: string, label: string, allowZero = false): string | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) {
    return `${label} must be a valid ${allowZero ? 'non-negative' : 'positive'} number.`;
  }
  return null;
}

export function integerInRange(value: number, label: string, min: number, max: number): string | null {
  if (!Number.isInteger(value) || value < min || value > max) {
    return `${label} must be an integer from ${min} to ${max}.`;
  }
  return null;
}

export function futureDateTime(value: string, label: string): string | null {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
    return `${label} must be a valid future date and time.`;
  }
  return null;
}
