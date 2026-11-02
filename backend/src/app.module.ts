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
import { AppFeedbackModule } from './modules/app-feedback/app-feedback.module';
import { StorageModule } from './storage/storage.module';
import { AppCheckGuard } from './firebase/app-check.guard';



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

        // Optional for Cloud Run, which authenticates with its attached runtime service account (ADC).
        // If supplied for local development, both values must be present.
        FIREBASE_CLIENT_EMAIL: Joi.string().email().optional(),

        FIREBASE_PRIVATE_KEY: Joi.string().optional(),

        FIREBASE_STORAGE_BUCKET: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),

        PASSWORD_RESET_URL: Joi.string().uri().default('https://rentitease.com/reset-password'),

        MAIL_HOST: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        MAIL_PORT: Joi.number().port().default(587),
        MAIL_USER: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        MAIL_PASSWORD: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        MAIL_FROM: Joi.string().email().default('no-reply@rentitease.com'),

        RAZORPAY_KEY_ID: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        RAZORPAY_KEY_SECRET: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),

        // Firebase is the only implemented storage adapter. Reject stale R2 config rather than silently writing to Firebase.
        STORAGE_DRIVER: Joi.string().valid('firebase').default('firebase'),

        SOCIAL_AUTOMATION_MODE: Joi.string()
          .valid('DISABLED', 'GENERATE_ONLY')
          .default('GENERATE_ONLY'),

        SOCIAL_SCHEDULER_ENABLED: Joi.boolean().default(false),

        SOCIAL_ACCOUNT_ENCRYPTION_KEY: Joi.string()
          .pattern(/^[0-9a-fA-F]{64}$/)
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),

        PORT: Joi.number().default(3000),

        CORS_ORIGINS: Joi.string().optional(),

        APP_CHECK_MODE: Joi.string()
          .valid('disabled', 'monitor', 'enforce')
          .default('monitor'),

        PUSH_OUTBOX_WORKER_ENABLED: Joi.boolean().default(true),
        PUSH_OUTBOX_POLL_INTERVAL_MS: Joi.number().integer().min(1000).max(60000).default(5000),
        PUSH_OUTBOX_BATCH_SIZE: Joi.number().integer().min(1).max(100).default(10),

        ALLOWED_HOSTS: Joi.string().default('api.rentitease.com'),

        TRUST_PROXY: Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0)).optional(),

        SWAGGER_ENABLED: Joi.boolean().default(false),

        SWAGGER_DOCS_TOKEN: Joi.string().min(32).optional(),

        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),

        APP_ENV: Joi.string()
          .valid('development', 'staging', 'production')
          .default('development'),

        OPENAI_API_KEY: Joi.string().min(20).optional(),

        OPENAI_LISTING_MODEL: Joi.string()
          .pattern(/^[a-zA-Z0-9._:-]{1,80}$/)
          .default('gpt-4o-mini'),

        OPENAI_BASE_URL: Joi.string()
          .uri({ scheme: ['https'] })
          .default('https://api.openai.com/v1'),
      }).and('FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
        getTracker: (request) => {
          const deviceId = request.headers['x-device-id'];
          const normalizedDevice = Array.isArray(deviceId) ? deviceId[0] : deviceId;
          return `${request.ip}:${normalizedDevice || 'no-device'}`;
        },
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
    AppFeedbackModule,
    StorageModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AppCheckGuard,
    },
  ],
})
export class AppModule {}
