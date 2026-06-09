import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './features/clients/client.module';
import { CommunityModule } from './features/communities/community.module';
import { FlagModule } from './features/flags/flag.module';
import { SurveyModule } from './features/survey/survey.module';
import { UserModule } from './features/users/user.module';
import { CryptographyModule } from './libs/auth';
import { ConfigModule, Module } from './libs/framework';

@Module({
  imports: [
    // TODO Make the dot-env file path configurable by environment
    ConfigModule.forRoot({
      isGlobal: true,
      // TODO Support a different env per environment. Use a different NODE_ENV for Docker runs vs. local npm runs.
      envFilePath: ['.env.local', '../../.env.local'],
    }),
    CryptographyModule,
    AuthModule,
    ClientModule,
    SurveyModule,
    FlagModule,
    CommunityModule,
    // TIUserModule?
    UserModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
