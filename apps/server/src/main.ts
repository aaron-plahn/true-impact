import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SuperTokensExceptionFilter } from 'supertokens-nestjs';
import supertokens from 'supertokens-node';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const NODE_PORT = configService.get('API_PORT', 3001);

  const clientBaseUrl = configService.get('CLIENT_DOMAIN', 'http://localhost');

  const clientPort = configService.get('CLIENT_PORT', 8080);

  const CLIENT_DOMAIN = `${clientBaseUrl}:${clientPort}`;

  app.enableCors({
    origin: [CLIENT_DOMAIN],
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  });

  app.useGlobalFilters(new SuperTokensExceptionFilter());

  await app.listen(NODE_PORT);
}

bootstrap();
