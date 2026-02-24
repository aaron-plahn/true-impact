import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SuperTokensExceptionFilter } from 'supertokens-nestjs';
import supertokens from 'supertokens-node';
import { AppModule } from './app.module';
import { TrueImpactError, TrueImpactRuntimeException } from './libs/data-types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // TODO the config service isn't picking this up from the .env when using the npm script `start`
  const NODE_PORT = configService.get<number>('API_PORT', 3001);

  const clientBaseUrl = configService.get<string>(
    'CLIENT_DOMAIN',
    'http://localhost',
  );

  const clientPort = configService.get<number>('CLIENT_PORT', 8080);

  const CLIENT_DOMAIN = `${clientBaseUrl}:${clientPort}`;

  app.enableCors({
    origin: [CLIENT_DOMAIN],
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  });

  app.useGlobalFilters(new SuperTokensExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('True Impact API')
    .setDescription('Internal Rest API for the True Impact Platform')
    // TODO SSOT for the server version between this and the package.json
    .setVersion('0.0.1')
    .addTag('CRM')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(NODE_PORT);

  console.log(`Listening on PORT: ${NODE_PORT}`);
}

bootstrap().catch((e) => {
  throw new TrueImpactRuntimeException([
    new TrueImpactError(`Failed to bootstrap the server application`, [
      new TrueImpactError(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        typeof e?.message === 'string' ? e?.message : 'Unknown NestJS error',
      ),
    ]),
  ]);
});
