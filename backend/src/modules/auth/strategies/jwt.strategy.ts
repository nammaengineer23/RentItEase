import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
  private readonly prisma: PrismaService,
  configService: ConfigService,
) {
  const accessSecret = configService.getOrThrow<string>(
    'JWT_ACCESS_SECRET',
  );

  super({
    jwtFromRequest:
      ExtractJwt.fromAuthHeaderAsBearerToken(),

    ignoreExpiration: false,

    secretOrKey: accessSecret,
  });
}
  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
  }
}