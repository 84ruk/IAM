import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { JwtExceptionFilter } from './common/filters/jwt-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); 

  app.enableCors({
    origin: process.env.FRONTEND_URL ,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    exposedHeaders: 'Set-Cookie',
  });

app.useGlobalFilters(new JwtExceptionFilter());
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


const port = process.env.PORT || 3001;
  await app.listen(port);
console.log(`Backend corriendo en: http://localhost:${port}`);
}
bootstrap();
