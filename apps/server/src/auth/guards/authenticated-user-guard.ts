import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { type SessionContainer } from 'supertokens-node/recipe/session';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../features/users/constants';
import type { IUserCommandRepository } from '../../features/users/repositories';
import { User } from '../../features/users/user.aggregate-root';
import { isNonEmptyString } from '../../libs/data-types';

export class AuthenticatedUserGuard implements CanActivate {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{ session?: SessionContainer; user?: User }>();

    const userId = req?.session?.getUserId();

    if (!isNonEmptyString(userId)) {
      return false;
    }

    const searchResult = await this.userCommandRepository.fetchById(userId);

    if (!searchResult) {
      return false;
    }

    req.user = searchResult;

    return true;
  }
}
