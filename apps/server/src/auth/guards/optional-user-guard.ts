import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../features/users/constants';
import type { IUserCommandRepository } from '../../features/users/repositories';
import { User } from '../../features/users/user.aggregate-root';

export class OptionalUserGuard implements CanActivate {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{ session?: { userId?: string }; user?: User }>();

    if (!req.session?.userId) {
      /**
       * The user can activate this endpoint but the controller \ service may
       * decide to respond differently because the user is a member of the general
       * public.
       */
      return true;
    }

    const searchResult = await this.userCommandRepository.fetchById(
      req.session.userId,
    );

    if (!searchResult) {
      /**
       * This is a system error. Some how the userId on the cookie
       * did not correspond to a member of the general public.
       * However, we fail gracefully by treating this user as a member of the general public.
       *
       * TODO Can we force the client to remove the cookie in this case?
       */
      return true;
    }

    req.user = searchResult;

    return true;
  }
}
