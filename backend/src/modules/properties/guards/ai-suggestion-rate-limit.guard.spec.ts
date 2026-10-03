import { ExecutionContext } from '@nestjs/common';
import { AiSuggestionRateLimitGuard } from './ai-suggestion-rate-limit.guard';

describe('AiSuggestionRateLimitGuard', () => {
  const context = (userId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: userId ? { id: userId } : undefined }),
      }),
    }) as unknown as ExecutionContext;

  it('requires an authenticated user', () => {
    const guard = new AiSuggestionRateLimitGuard();
    expect(() => guard.canActivate(context())).toThrow('AI suggestion access is rate limited.');
  });

  it('limits each authenticated user independently', () => {
    const guard = new AiSuggestionRateLimitGuard();

    for (let i = 0; i < 10; i += 1) {
      expect(guard.canActivate(context('owner-1'))).toBe(true);
    }

    expect(() => guard.canActivate(context('owner-1'))).toThrow(
      'AI suggestion rate limit exceeded.',
    );

    expect(guard.canActivate(context('owner-2'))).toBe(true);
  });
});
