import { Module } from '@nestjs/common';
import { SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN } from 'src/features/survey/survey-completion/repositories/survey-response.session-repository.interface';

import { InMemorySurveyResponseSessionRepository } from 'src/features/survey/survey-completion/repositories/in-memory-survey-response.session-repository';
import { SurveyResponseSessionStore } from 'src/features/survey/survey-completion/repositories/survey-response.session-store';
import { UserAuthenticationService } from 'src/features/users/user-authentication.service';
import { UserModule } from 'src/features/users/user.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [UserModule],
  providers: [
    UserAuthenticationService,
    {
      provide: SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN,
      useClass: InMemorySurveyResponseSessionRepository,
    },
    SurveyResponseSessionStore,
  ],
  exports: [
    SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN,
    SurveyResponseSessionStore,
  ],

  controllers: [AuthController],
})
export class AuthModule {}
