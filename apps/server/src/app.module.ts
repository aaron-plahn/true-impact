import {
  MiddlewareConsumer,
  Module,
  NestModule,
  UseGuards,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { SuperTokensAuthGuard, SuperTokensModule } from 'supertokens-nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupertokensConfigService } from './auth/supertokens-config.service';
import { SupertokensMiddleware } from './auth/supertokens.middleware';

@UseGuards(SuperTokensAuthGuard)
@Module({
  imports: [
    // TODO Make the dot-env file path configurable by environment
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.local' }),
    SuperTokensModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        new SupertokensConfigService(configService).createSuperTokensModuleOptions(),
      inject: [ConfigService]
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
