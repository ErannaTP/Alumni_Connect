import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // 🔥 THIS IS THE IMPORTANT FIX
  app.setGlobalPrefix('api');

  await app.listen(4000);
  console.log('🚀 Backend running at http://localhost:4000');
  console.log('📌 API available at http://localhost:4000/api/... endpoints');
}

bootstrap();
