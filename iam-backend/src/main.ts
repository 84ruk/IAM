import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { globalFilters } from './config/filters.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); 

  // Configuración de CORS mejorada para cross-domain cookies
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  app.enableCors(corsOptions);

  app.useGlobalFilters(...globalFilters);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 400,
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: errors.map(err => {
            const constraints = err.constraints
              ? Object.values(err.constraints).join(', ')
              : 'Error desconocido';
            return `${err.property} -> ${constraints}`;
          }),
        });
      },
    }),
  );

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
}
bootstrap();
