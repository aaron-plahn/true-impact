import { Module } from '@nestjs/common';
import { InMemorySurveyResponseSessionRepository } from 'src/features/survey/survey-completion/repositories/in-memory-survey-response.session-repository';
import { SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN } from 'src/features/survey/survey-completion/repositories/survey-response.session-repository.interface';
import { SurveyResponseSessionStore } from 'src/features/survey/survey-completion/repositories/survey-response.session-store';

@Module({
  providers: [
    // TODO Provide a production grade implementation with PostgreSQL or Redis
    {
      provide: SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN,
      useClass: InMemorySurveyResponseSessionRepository,
    },
    SurveyResponseSessionStore,
  ],
  exports: [SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN],
})
export class AuthModule {}
