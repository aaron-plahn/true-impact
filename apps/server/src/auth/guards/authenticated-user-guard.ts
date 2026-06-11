import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../features/users/constants';
import type { IUserCommandRepository } from '../../features/users/repositories';
import { User } from '../../features/users/user.aggregate-root';

export class AuthenticatedUserGuard implements CanActivate {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{ session?: { userId?: string }; user?: User }>();

    if (!req.session?.userId) {
      return false;
    }

    const searchResult = await this.userCommandRepository.fetchById(
      req.session.userId,
    );

    if (!searchResult) {
      return false;
    }

    req.user = searchResult;

    return true;
  }
}
