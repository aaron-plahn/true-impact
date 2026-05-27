import { Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { EncryptionService } from 'src/libs/auth';
import { TrueImpactError } from 'src/libs/data-types';
import type { ICommandFsa } from '../../../libs/cqrs-es';
import { CommandHandlerService } from '../../../libs/cqrs-es';
import { Body, Controller, Post } from '../../../libs/framework';
import {
  SurveyResponseCookie,
  SurveyResponseSession,
} from './models/survey-response-session';
import {
  SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN,
  type ISurveyResponseSessionRepository,
} from './repositories/survey-response.session-repository.interface';

const SURVEY_COMPLETION_COOKIE_NAME = 'survey-response-session';

@Controller('surveys/responses')
export class SurveyResponseCommandController {
  constructor(
    private readonly commandHandlerService: CommandHandlerService,
    @Inject(SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepository: ISurveyResponseSessionRepository,
    private readonly cryptoService: EncryptionService,
  ) {}

  @Post('commands')
  async executeCommand(
    @Body() fsa: ICommandFsa,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (SURVEY_COMPLETION_COOKIE_NAME in req.signedCookies) {
      Object.assign(fsa.payload, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        accessCode: req.signedCookies[SURVEY_COMPLETION_COOKIE_NAME] as string,
      });
    }

    const result = await this.commandHandlerService.execute(fsa);

    if (!(result instanceof TrueImpactError)) {
      if (fsa.type === 'BEGIN_SURVEY') {
        const cookie: SurveyResponseCookie = {
          originalMaxAge: 60 * 60 * 1000, // 1 h in ms
          signed: true,
          // expires // TODO
          httpOnly: true,
          path: SURVEY_COMPLETION_COOKIE_NAME,
          // domain
          // secure
          // sameSite
        };

        const session: SurveyResponseSession = {
          id: this.cryptoService.generateSessionId(),
          subject: {
            type: 'survey response record',
            id: result.id,
          },
          cookie,
        };

        await this.sessionRepository.set(session);

        // Do we really need this or can we simply put the survey ID in the cookie?
        res.cookie(SURVEY_COMPLETION_COOKIE_NAME, cookie);
      }
    }

    return result;
  }
}
