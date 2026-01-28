import {
  MiddlewareConsumer,
  Module,
  NestModule,
  UseGuards,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperTokensAuthGuard, SuperTokensModule } from 'supertokens-nestjs';
import { AppController } from './app.controller';
import { SupertokensConfigService } from './auth/supertokens-config.service';
import { SupertokensMiddleware } from './auth/supertokens.middleware';
import { ClientModule } from './features/clients/client.module';

@UseGuards(SuperTokensAuthGuard)
@Module({
  imports: [
    // TODO Make the dot-env file path configurable by environment
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.local' }),
    SuperTokensModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        new SupertokensConfigService(
          configService,
        ).createSuperTokensModuleOptions(),
      inject: [ConfigService],
    }),
    ClientModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
