import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from 'src/features/users/constants';
import type { ITiSystemUserCommandRepository } from 'src/features/users/repositories';
import { TiSystemUser } from 'src/features/users/ti-system-user.aggregate-root';

export class AuthenticatedUserGuard implements CanActivate {
  constructor(
    @Inject(TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: ITiSystemUserCommandRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{ session?: { userId?: string }; user?: TiSystemUser }>();

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
