import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FirebaseModule } from './firebase/firebase.module';
import { join } from 'path';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeaseModule } from './modules/lease/lease.module';
import { PremiumListingsModule } from './modules/premium-listings/premium-listings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MembershipModule } from './modules/membership/membership.module';
import { DatabaseModule } from './database/database.module';
import { PrismaModule } from './prisma/prisma.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { OtpModule } from './common/otp/otp.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { AmenitiesModule } from './modules/amenities/amenities.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PropertyImagesModule } from './modules/property-images/property-images.module';
import { BookingModule } from './modules/booking/booking.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { PropertyVisitsModule } from './modules/property-visits/property-visits.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { OwnerDashboardModule } from './modules/owner-dashboard/owner-dashboard.module';
import { ChatModule } from './modules/chat/chat.module';
import { PushNotificationsModule } from './modules/push-notifications/push-notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './mail/mail.module';
import { UserDevicesModule } from './modules/user-devices/user-devices.module';
import { AdminBillingModule } from "./modules/admin-billing/admin-billing.module";
import { SocialMediaModule } from './modules/social-media/social-media.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',

      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),

        JWT_ACCESS_SECRET: Joi.string().min(16).required(),

        JWT_REFRESH_SECRET: Joi.string().min(16).required(),

        FIREBASE_PROJECT_ID: Joi.string().required(),

        FIREBASE_CLIENT_EMAIL: Joi.string().email().required(),

        FIREBASE_PRIVATE_KEY: Joi.string().required(),

        PORT: Joi.number().default(3000),

        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    DatabaseModule,
    PrismaModule,
    AuthModule,
    OtpModule,
    UsersModule,
    PropertiesModule,
    AmenitiesModule,
    UploadsModule,
    PropertyImagesModule,
    FavoritesModule,
    FirebaseModule,
    PropertyVisitsModule,
    NotificationsModule,
    ReviewsModule,
    SettingsModule,
    OwnerDashboardModule,
    ChatModule,
    LeaseModule,
    PaymentsModule,
    PushNotificationsModule,
    AdminModule,
    HealthModule,
    MailModule,
    UserDevicesModule,
    MembershipModule,
    PremiumListingsModule,
    InvoicesModule,
    BookingModule,
    AdminBillingModule,
    SocialMediaModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}