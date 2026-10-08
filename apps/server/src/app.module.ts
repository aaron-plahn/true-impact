import { SupertokensService } from 'supertokens-node/recipe/passwordless/smsdelivery';
import { AppController } from './app.controller';
import { SupertokensConfigService, SupertokensMiddleware } from './auth';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './features/clients/client.module';
import { CommunityModule } from './features/communities/community.module';
import { FlagModule } from './features/flags/flag.module';
import { GroupProgramModule } from './features/group-programs/domain/group-program.module';
import { SurveyModule } from './features/survey/survey.module';
import { UserModule } from './features/users/user.module';
import { CryptographyModule } from './libs/auth';
import {
  ConfigModule,
  ConfigService,
  MiddlewareConsumer,
  Module,
  NestModule,
} from './libs/framework';
import { PostgresModule } from './postgresql/postgres.module';

const nodeEnv = process.env.NODE_ENV || 'local';

console.log(`Loading NestJS configuration for environment: ${nodeEnv}`);

@Module({
  imports: [
    // TODO Make the dot-env file path configurable by environment
    ConfigModule.forRoot({
      isGlobal: true,
      // TODO Support a different env per environment. Use a different NODE_ENV for Docker runs vs. local npm runs.
      envFilePath: [`.env.${nodeEnv}`, `../../.env.${nodeEnv}`],
    }),
    PostgresModule.forRootAsync(),
    AuthModule.forRootAsync({
      imports: [], // [ConfigModule?]
      useFactory: (configService: ConfigService) => {
        return new SupertokensConfigService(
          configService,
        ).createSuperTokensModuleOptions();
      },
      inject: [ConfigService],
    }),
    CryptographyModule,
    AuthModule,
    ClientModule,
    SurveyModule,
    FlagModule,
    CommunityModule,
    // TIUserModule?
    UserModule,
    GroupProgramModule,
  ],
  controllers: [AppController],
  providers: [SupertokensService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
