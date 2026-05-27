import { NestMiddleware } from '@nestjs/common';
import { Request } from 'express';
import { SurveyResponseCompositeIdentifier } from 'src/features/survey/survey-completion';
import { SurveyResponseSession } from 'src/features/survey/survey-completion/models/survey-response-session';
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const cookie = req.signedCookies['survey-response-session'] as
      | SurveyResponseSession
      | undefined;

    if (!cookie || !cookie.id) {
      return next();
    }

    this.sessionRepository
      .get(cookie.id)
      .then((result) => {
        if (result instanceof Error) {
          return next(result);
        }

        req.user = {
          type: 'SURVEY_PARTICIPANT',
          subject: result.subject,
        };

        return next();
      })
      .catch((err) => {
        next(err);
      });
  }
}
