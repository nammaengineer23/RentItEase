import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class FirebaseAppCheckGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const token = request.headers['x-firebase-appcheck'];
    const appCheckToken = Array.isArray(token) ? token[0] : token;

    if (!appCheckToken || typeof appCheckToken !== 'string') {
      throw new UnauthorizedException('Firebase App Check verification required.');
    }

    try {
      await this.firebaseService.verifyAppCheckToken(appCheckToken);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Firebase App Check token.');
    }
  }
}
