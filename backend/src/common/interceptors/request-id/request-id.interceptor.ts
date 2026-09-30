import { randomUUID } from 'crypto';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const incoming = request.get('x-request-id')?.trim();
    const requestId = incoming && /^[A-Za-z0-9._:-]{1,128}$/.test(incoming) ? incoming : randomUUID();
    (request as Request & { requestId?: string }).requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    return next.handle();
  }
}
