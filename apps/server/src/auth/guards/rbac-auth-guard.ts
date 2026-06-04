import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TiSystemUser } from 'src/features/users/ti-system-user.aggregate-root';

@Injectable()
export class RbacAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: TiSystemUser }>();

    if (!req.user) {
      return false;
    }

    // TODO We can use reflection and an `@AllowedRoles` decorator to have different logic per endpoint
    if (req.user.role === 'system admin' || req.user.role === 'tenant admin') {
      return true;
    }

    return false;
  }
}
