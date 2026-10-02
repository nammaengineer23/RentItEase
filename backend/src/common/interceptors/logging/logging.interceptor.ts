import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { redactUrl } from '../../logging/sensitive-data.util';

type RequestWithId = Request & { requestId?: string };

type PrismaKnownRequestErrorLike = {
  code: string;
  meta?: Record<string, unknown>;
};

function getSafePrismaDetails(error: unknown): Record<string, unknown> | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const candidate = error as Partial<PrismaKnownRequestErrorLike>;
  if (typeof candidate.code !== 'string' || !/^P\d{4}$/.test(candidate.code)) {
    return undefined;
  }

  const safeMetaKeys = ['target', 'modelName', 'field_name', 'constraint'];
  const meta =
    candidate.meta && typeof candidate.meta === 'object'
      ? Object.fromEntries(
          safeMetaKeys
            .filter((key) => key in candidate.meta!)
            .map((key) => [key, candidate.meta![key]]),
        )
      : undefined;

  return {
    prismaCode: candidate.code,
    ...(meta && Object.keys(meta).length > 0 ? { prismaMeta: meta } : {}),
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const startedAt = Date.now();
    const method = request.method;
    const path = redactUrl(request.originalUrl || request.url);
    const requestId = request.requestId || 'unknown';

    const write = (status: number, level: 'log' | 'warn' | 'error', error?: unknown) => {
      const entry = {
        event: 'http_request',
        requestId,
        method,
        path,
        status,
        durationMs: Date.now() - startedAt,
        ...(error instanceof Error ? { error: error.name } : {}),
        ...(getSafePrismaDetails(error) ?? {}),
      };
      this.logger[level](JSON.stringify(entry));
    };

    return next.handle().pipe(
      tap(() => write(200, 'log')),
      catchError((error: unknown) => {
        const status = typeof error === 'object' && error !== null && 'getStatus' in error && typeof (error as { getStatus?: unknown }).getStatus === 'function'
          ? Number((error as { getStatus: () => number }).getStatus())
          : 500;
        write(status, status >= 500 ? 'error' : 'warn', error);
        return throwError(() => error);
      }),
    );
  }
}
