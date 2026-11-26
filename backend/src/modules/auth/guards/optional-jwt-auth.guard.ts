import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;

    // Public requests may omit credentials. If credentials are supplied,
    // the normal JWT guard must validate them.
    if (!authorization) {
      return true;
    }

    return super.canActivate(context);
  }
}
