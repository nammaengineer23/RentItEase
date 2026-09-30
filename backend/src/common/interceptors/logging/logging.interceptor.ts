import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { redactUrl } from '../../logging/sensitive-data.util';

type RequestWithId = Request & { requestId?: string };

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
