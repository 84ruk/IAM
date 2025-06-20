import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); 

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });


const port = process.env.PORT || 3001;
  await app.listen(port);
console.log(`Backend corriendo en: http://localhost:${port}`);
}
bootstrap();
