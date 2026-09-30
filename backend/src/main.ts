import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform/transform.interceptor';

// Prisma Decimal values must be JSON-safe for mobile and web clients.
Prisma.Decimal.prototype.toJSON = function toJSON() {
  return this.toString();
};

const PRODUCTION_ORIGINS = [
  'https://rentitease.com',
  'https://www.rentitease.com',
];

function getCorsOrigins(): string[] {
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production') {
    const origins = configured.length > 0 ? configured : PRODUCTION_ORIGINS;
    return origins.filter(
      (origin) =>
        origin.startsWith('https://') &&
        !origin.includes('localhost') &&
        !origin.includes('127.0.0.1'),
    );
  }

  return [...new Set([...PRODUCTION_ORIGINS, ...configured, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'])];
}

function getTrustProxy(): boolean | number {
  const value = process.env.TRUST_PROXY;
  if (value === undefined || value === '') {
    return process.env.NODE_ENV === 'production';
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return value === 'true';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.set('trust proxy', getTrustProxy());

  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    json({
      limit: '1mb',
    }),
    urlencoded({
      extended: true,
      limit: '1mb',
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: true,
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  if (isProduction) {
    app.use((req, res, next) => {
      if (!req.secure) {
        const host = req.get('host');
        if (!host) {
          res.status(400).send('Invalid host');
          return;
        }
        res.redirect(308, `https://${host}${req.originalUrl}`);
        return;
      }
      next();
    });
  }

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['privacy-policy', 'terms', 'terms-of-service', 'delete-account'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const config = new DocumentBuilder()
    .setTitle('RentItEase API')
    .setDescription('Production-ready Rental Property Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log('🚀 RentItEase Backend Running');
  console.log('🌐 API: http://localhost:3000/api/v1');
  console.log('📘 Swagger: http://localhost:3000/api');
}

bootstrap();
