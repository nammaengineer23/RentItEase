import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { FirebaseModule } from '../../firebase/firebase.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../../mail/mail.module';
import { OtpModule } from '../../common/otp/otp.module';


@Module({
  imports: [
    ConfigModule,
    FirebaseModule,
    MailModule,
    OtpModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),

        signOptions: {
          expiresIn:
            (configService.get(
              'JWT_ACCESS_EXPIRES_IN',
            ) ?? '15m') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
