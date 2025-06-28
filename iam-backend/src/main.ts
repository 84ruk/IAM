import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { globalFilters } from './config/filters.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); 

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    exposedHeaders: 'Set-Cookie',
  });

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
