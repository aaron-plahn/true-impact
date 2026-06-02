import { Inject } from '@nestjs/common';
import { EncryptionService } from 'src/libs/auth';
import { CommandHandlerService } from '../../../libs/cqrs-es';
import { Controller } from '../../../libs/framework';
import {
  SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN,
  type ISurveyResponseSessionRepository,
} from './repositories/survey-response.session-repository.interface';

@Controller('surveys/responses')
export class SurveyResponseCommandController {
  constructor(
    private readonly commandHandlerService: CommandHandlerService,
    @Inject(SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepository: ISurveyResponseSessionRepository,
    private readonly cryptoService: EncryptionService,
  ) {}
}
