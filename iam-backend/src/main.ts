import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { globalFilters } from './config/filters.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); 

<<<<<<< HEAD
  // Configuración de CORS mejorada para cross-domain cookies
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
=======
  // Agregar header para Private Network Access (PNA)
  app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network']) {
      res.header('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  // Configuración CORS para múltiples orígenes
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://iam-frontend-six.vercel.app',
    'https://iam-frontend.vercel.app'
  ];

  app.enableCors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como mobile apps o Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
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
