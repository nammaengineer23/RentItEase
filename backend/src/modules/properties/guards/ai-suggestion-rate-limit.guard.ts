import { CanActivate, ExecutionContext, Injectable, TooManyRequestsException } from '@nestjs/common';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class AiSuggestionRateLimitGuard implements CanActivate {
  private readonly limit = 10;
  private readonly windowMs = 60_000;
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // The route is JWT-protected; fail closed if authentication did not run.
    if (!userId) {
      throw new TooManyRequestsException('AI suggestion access is rate limited.');
    }

    const now = Date.now();
    const current = this.buckets.get(userId);
    if (!current || current.resetAt <= now) {
      this.buckets.set(userId, { count: 1, resetAt: now + this.windowMs });
      this.prune(now);
      return true;
    }

    if (current.count >= this.limit) {
      throw new TooManyRequestsException('AI suggestion rate limit exceeded. Please try again shortly.');
    }

    current.count += 1;
    return true;
  }

  private prune(now: number) {
    if (this.buckets.size < 1000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}
