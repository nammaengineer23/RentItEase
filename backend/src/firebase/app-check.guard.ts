import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';

type AppCheckMode = 'disabled' | 'monitor' | 'enforce';

@Injectable()
export class AppCheckGuard implements CanActivate {
  private readonly logger = new Logger(AppCheckGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      path?: string;
      headers?: Record<string, string | string[] | undefined>;
    }>();

    if (
      request.method === 'OPTIONS' ||
      request.path === '/api/v1/health' ||
      request.path === '/health'
    ) {
      return true;
    }

    const mode = (this.configService.get<string>('APP_CHECK_MODE', 'monitor') ??
      'monitor') as AppCheckMode;
    if (mode === 'disabled') return true;

    const rawHeader = request.headers?.['x-firebase-appcheck'];
    const token = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!token) {
      this.logger.warn(
        `App Check token missing: mode=${mode} method=${request.method ?? 'unknown'} path=${request.path ?? 'unknown'}`,
      );
      if (mode === 'enforce') {
        throw new ForbiddenException('A valid Firebase App Check token is required.');
      }
      return true;
    }

    const valid = await this.firebaseService.verifyAppCheckToken(token);
    if (!valid) {
      this.logger.warn(
        `App Check token invalid: mode=${mode} method=${request.method ?? 'unknown'} path=${request.path ?? 'unknown'}`,
      );
      if (mode === 'enforce') {
        throw new ForbiddenException('A valid Firebase App Check token is required.');
      }
      return true;
    }

    return true;
  }
}
