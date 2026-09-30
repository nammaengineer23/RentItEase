import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtSecretService } from '../../../common/auth/jwt-secret.service';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    jwtSecretService: JwtSecretService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (_request, rawJwtToken, done) => {
        try {
          const header = JSON.parse(
            Buffer.from(rawJwtToken.split('.')[0], 'base64url').toString('utf8'),
          ) as { kid?: string };

          done(null, jwtSecretService.selectAccessSecret(header.kid));
        } catch (error) {
          done(error instanceof Error ? error : new Error('Invalid JWT.'));
        }
      },
    });
  }

  async validate(payload: { sub?: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or inactive account.');
    }

    // Load role from the database so role changes take effect without
    // waiting for an existing access token to expire.
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
  }
}
