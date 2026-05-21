import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const HashedPasscode = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const result =
      (request.body as { hashedPasscode?: string })?.hashedPasscode || null;

    return result;
  },
);
