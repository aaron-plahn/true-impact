import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import * as supertokensRecipeSession from 'supertokens-node/recipe/session';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../features/survey/constants';
import { AnonymousSurveyParticipantUser } from '../../features/survey/survey-completion/models';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../features/users/constants';
import type { IUserCommandRepository } from '../../features/users/repositories';
import { User } from '../../features/users/user.aggregate-root';
import { isNonEmptyString } from '../../libs/data-types';

export class OptionalUserGuard implements CanActivate {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();

    const req: { user: User | AnonymousSurveyParticipantUser } =
      ctx.getRequest();
    const resp: Response = ctx.getResponse();

    /**
     * If the session doesn't exist and {sessionRequired: true} is passed to the AuthGuard constructor (default is true),
     * getSession will throw an error that will be handled by the exception filter, returning a 401 response.
     */

    const session = await supertokensRecipeSession.getSession(req, resp, {
      sessionRequired: false,
    });

    const userId = session?.getUserId();

    if (!isNonEmptyString(userId)) {
      return true;
    }

    const searchResult = await this.userCommandRepository.fetchById(userId);

    if (!searchResult) {
      const accessTokenPayload = session?.getAccessTokenPayload() as {
        subject?: { type: string; id: string };
      };

      if (accessTokenPayload && accessTokenPayload.subject) {
        const { type: subjectType, id: subjectId } = accessTokenPayload.subject;

        if (
          subjectType !== SURVEY_RESPONSE_AGGREGATE_TYPE ||
          !isNonEmptyString(subjectId)
        ) {
          return true;
        }

        // The session is for survey participation
        req.user = new AnonymousSurveyParticipantUser({
          surveyResponseId: subjectId,
        });

        return true;
      }

      return true;
    }

    req.user = searchResult;

    return true;
  }
}
