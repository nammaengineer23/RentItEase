import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { redactSensitive } from '../../logging/sensitive-data.util';

type RequestWithId = Request & { requestId?: string };

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = request.requestId || 'unknown';

    let message: string | string[] = 'Internal server error';
    if (status < 500 && exception instanceof HttpException) {
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined;
      if (typeof raw === 'string') message = redactSensitive(raw) as string;
      else if (Array.isArray(raw)) message = raw.map((item) => String(redactSensitive(item)));
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl?.split('?')[0] || request.path,
      requestId,
    });
  }
}
