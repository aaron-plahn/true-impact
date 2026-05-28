import { NestMiddleware } from '@nestjs/common';
import { Request } from 'express';
import { SurveyResponseCompositeIdentifier } from 'src/features/survey/survey-completion';
import { ISurveyResponseSessionRepository } from 'src/features/survey/survey-completion/repositories/survey-response.session-repository.interface';

export class SurveyCompletionMiddleware implements NestMiddleware {
  constructor(
    private readonly sessionRepository: ISurveyResponseSessionRepository,
  ) {}

  use(
    req: Request & {
      user?: {
        type: 'SURVEY_PARTICIPANT';
        subject: SurveyResponseCompositeIdentifier;
      };
    },
    _res: any,
    next: (error?: any) => void,
  ) {
    const subject = req.session?.subject;

    if (!subject) {
      return next();
    }

    req.user = {
      type: 'SURVEY_PARTICIPANT',
      subject,
    };

    next();
  }
}
