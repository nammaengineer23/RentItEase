import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import helmet from 'helmet';
import { json, urlencoded, type NextFunction, type Request, type Response } from 'express';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging/logging.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id/request-id.interceptor';
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
    // Production CORS is an exact allowlist. Never accept arbitrary HTTPS origins.
    return [...new Set(configured.length > 0 ? configured : PRODUCTION_ORIGINS)].filter(
      (origin) => PRODUCTION_ORIGINS.includes(origin),
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

  app.enableShutdownHooks();

  app.getHttpAdapter().getInstance().set('trust proxy', getTrustProxy());

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedHosts = (process.env.ALLOWED_HOSTS || 'api.rentitease.com')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
  const swaggerToken = process.env.SWAGGER_DOCS_TOKEN;

  app.use(
    json({
      limit: '1mb',
      verify: (req: Request, _res: Response, buffer: Buffer) => {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      },
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
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Railway probes the configured healthcheck from inside its infrastructure.
      // Do not subject that probe to the public host/HTTPS policy; all application
      // routes remain protected by the exact production host allowlist.
      if (req.path === '/api/v1/health' && (req.method === 'GET' || req.method === 'HEAD')) {
        next();
        return;
      }

      const host = (req.get('host') || '').split(':')[0].toLowerCase();
      if (!host || !allowedHosts.includes(host)) {
        res.status(400).send('Invalid host');
        return;
      }

      if (!req.secure) {
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Device-Id',
      'X-Firebase-AppCheck',
    ],
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
    new RequestIdInterceptor(),
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  if (!isProduction || swaggerEnabled) {
    if (isProduction && !swaggerToken) {
      throw new Error('SWAGGER_DOCS_TOKEN is required when SWAGGER_ENABLED=true in production');
    }

    const config = new DocumentBuilder()
      .setTitle('RentItEase API')
      .setDescription(
        'RentItEase REST API. Authentication uses JWT bearer tokens. Admin endpoints require the ADMIN role. Payment amounts are server-authoritative; clients must create and verify payments through the documented flow. Paginated endpoints expose page/limit controls where applicable. Provider webhooks are documented only when implemented.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    if (isProduction) {
      app.use('/api', (req: Request, res: Response, next: NextFunction) => {
        const header = req.get('authorization') || '';
        const supplied =
          req.get('x-swagger-token') ||
          (header.startsWith('Bearer ') ? header.slice(7) : '');
        if (!swaggerToken || supplied !== swaggerToken) {
          res.status(401).json({ message: 'Swagger documentation is protected' });
          return;
        }
        next();
      });
    }

    SwaggerModule.setup('api', app, document, {
      jsonDocumentUrl: 'api-json',
      swaggerOptions: {
        persistAuthorization: false,
        filter: true,
      },
    });
  }

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log('🚀 RentItEase Backend Running');
  console.log('🌐 API: http://localhost:3000/api/v1');
  if (!isProduction || swaggerEnabled) console.log('📘 Swagger: /api (protected in production)');
}

bootstrap();
