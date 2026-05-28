import { Module } from '@nestjs/common';
import { SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN } from 'src/features/survey/survey-completion/repositories/survey-response.session-repository.interface';

import { UserAuthenticationService } from 'src/features/users/user-authentication.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [UserAuthenticationService],
  exports: [SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN],

  controllers: [AuthController],
})
export class AuthModule {}
