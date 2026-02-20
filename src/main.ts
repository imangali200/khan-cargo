import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Khan-Cargo API')
    .setDescription('Khan Cargo logistics + social feed API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Registration & Login')
    .addTag('Admin - User Management', 'SUPERADMIN only')
    .addTag('Branches', 'SUPERADMIN only')
    .addTag('Tracking', 'Tracking items & statuses')
    .addTag('Feed', 'Posts, likes, comments')
    .addTag('Profile', 'User profile')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
