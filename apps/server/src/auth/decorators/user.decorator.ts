import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as TiSystemUser } from '../../features/users/user.aggregate-root';

export const User = createParamDecorator((ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: TiSystemUser }>();

  const user = request.user;

  if (!user) {
    return null;
  }

  return user;
});
