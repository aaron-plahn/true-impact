import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import supertokens from 'supertokens-node';
import {
  SuperTokensExceptionFilter,
  SuperTokensModule,
} from 'supertokens-nestjs';
import { ConfigService } from '@nestjs/config';
import { SupertokensConfigService } from './auth/supertokens-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      // TODO Take this from the config
      'http://localhost:4200',
    ],
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  });

  app.useGlobalFilters(new SuperTokensExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
