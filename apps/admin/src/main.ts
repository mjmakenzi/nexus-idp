import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { SwaggerTheme } from 'swagger-themes';
import { AdminModule } from './admin.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AdminModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableVersioning();
  const configService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      disableErrorMessages: configService.getOrThrow<boolean>('isProduction'),
    }),
  );

  if (!configService.getOrThrow<boolean>('isProduction')) {
    const config = new DocumentBuilder()
      .setTitle('IDP Admin')
      .setDescription('The IDP Admin description')
      .setVersion(configService.getOrThrow<string>('version'))
      .addServer(configService.getOrThrow<string>('swaggerUrlPrefix'))
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    const swaggerTheme = new SwaggerTheme();
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'IDP Admin Swagger',
    });
  }

  await app.listen(
    configService.getOrThrow<number>('port'),
    configService.getOrThrow<string>('host'),
  );
}
bootstrap();
