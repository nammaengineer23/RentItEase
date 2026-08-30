import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  app.enableCors({
    origin: [
      'https://rentitease.com',
      'https://www.rentitease.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api/v1');

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
