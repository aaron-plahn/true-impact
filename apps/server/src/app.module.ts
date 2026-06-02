import { SuperTokensAuthGuard, SuperTokensModule } from 'supertokens-nestjs';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { SupertokensConfigService } from './auth/supertokens-config.service';
import { SupertokensMiddleware } from './auth/supertokens.middleware';
import { ClientModule } from './features/clients/client.module';
import { CommunityModule } from './features/communities/community.module';
import { FlagModule } from './features/flags/flag.module';
import { SurveyModule } from './features/survey/survey.module';
import {
  ConfigModule,
  ConfigService,
  MiddlewareConsumer,
  Module,
  NestModule,
  UseGuards,
} from './libs/framework';

@UseGuards(SuperTokensAuthGuard)
@Module({
  imports: [
    // TODO Make the dot-env file path configurable by environment
    ConfigModule.forRoot({
      isGlobal: true,
      // TODO Support a different env per environment. Use a different NODE_ENV for Docker runs vs. local npm runs.
      envFilePath: ['.env.local', '../../.env.local'],
    }),
    SuperTokensModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        new SupertokensConfigService(
          configService,
        ).createSuperTokensModuleOptions(),
      inject: [ConfigService],
    }),
    AuthModule,
    ClientModule,
    SurveyModule,
    FlagModule,
    CommunityModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // TODO we can implement our own auth solution now
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
