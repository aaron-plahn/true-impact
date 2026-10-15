/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request } from 'express';
import * as supertokensRecipeSession from 'supertokens-node/recipe/session';
import { AnonymousSurveyParticipantUser } from '../../features/survey/survey-completion/models';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../features/users/constants';
import { type IUserCommandRepository } from '../../features/users/repositories';
import { UserRole } from '../../features/users/types';
import { User } from '../../features/users/user.aggregate-root';
import { isNonEmptyString } from '../../libs/data-types';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '../../libs/framework';

const adminRoles: UserRole[] = ['system admin', 'tenant admin'];

// TODO rename this file
@Injectable()
export class AdminRbacAuthGuard implements CanActivate {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest<
      Request & { user: User | AnonymousSurveyParticipantUser }
    >();
    const resp = ctx.getResponse();

    /**
     * If the session doesn't exist and {sessionRequired: true} is passed to the AuthGuard constructor (default is true),
     * getSession will throw an error that will be handled by the exception filter, returning a 401 response.
     */

    const session = await supertokensRecipeSession.getSession(req, resp, {
      sessionRequired: false,
    });

    const userId = session?.getUserId();

    if (!isNonEmptyString(userId)) {
      return false;
    }

    const searchResult = await this.userCommandRepository.fetchById(userId);

    if (!searchResult) {
      return false;
    }

    if (!adminRoles.includes(searchResult.role)) {
      return false;
    }

    req.user = searchResult;

    return true;
  }
}
