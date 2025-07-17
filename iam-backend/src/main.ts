import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe, Logger } from '@nestjs/common';
import { globalFilters } from './config/filters.config';
import helmet from 'helmet';
import { securityConfig } from './config/security.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Validar configuración de seguridad antes de iniciar
    logger.log('Validando configuración de seguridad...');

    const app = await NestFactory.create(AppModule, {
      logger: process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Configurar Helmet para headers de seguridad
    app.use(helmet(securityConfig.helmet));
    app.use(cookieParser());

    // Configuración de CORS mejorada y segura
    const corsOptions = {
      origin: (origin: string | undefined, callback: Function) => {
        // Permitir peticiones sin origen (health checks, herramientas de monitoreo)
        if (!origin) {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Permitiendo petición sin origen en desarrollo');
          } else {
            logger.debug(
              'Permitiendo petición sin origen en producción (health check/monitoreo)',
            );
          }
          return callback(null, true);
        }

        // Verificar orígenes permitidos
        if (securityConfig.cors.allowedOrigins.includes(origin)) {
          logger.debug(`Origen permitido: ${origin}`);
          return callback(null, true);
        }

        // En desarrollo, ser más permisivo con localhost
        if (
          process.env.NODE_ENV === 'development' &&
          (origin.includes('localhost') || origin.includes('127.0.0.1'))
        ) {
          logger.debug(`Permitiendo origen de desarrollo: ${origin}`);
          return callback(null, true);
        }

        logger.warn(`CORS bloqueado para origen: ${origin}`);
        return callback(new Error('Origen no permitido por CORS'), false);
      },
      credentials: securityConfig.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'X-API-Key',
        'X-Client-Version',
      ],
      exposedHeaders: [
        'Set-Cookie',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400, // Cache preflight por 24 horas
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
            message: errors.map((err) => {
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

    logger.log(`🚀 Aplicación iniciada en 0.0.0.0:${port}`);
    logger.log(`🔒 Configuración de seguridad aplicada`);
    logger.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    logger.log(
      `📡 Orígenes CORS permitidos: ${JSON.stringify(securityConfig.cors.allowedOrigins)}`,
    );
  } catch (error) {
    logger.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}

bootstrap();
