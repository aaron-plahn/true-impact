import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TiSystemUser } from 'src/features/users/ti-system-user.aggregate-root';

export const User = createParamDecorator((ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: TiSystemUser }>();

  const user = request.user;

  if (!user) {
    return null;
  }

  return user;
});
