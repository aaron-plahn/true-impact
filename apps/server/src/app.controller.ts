import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth/auth.guard';
import { Session } from 'supertokens-nestjs';
import session from 'supertokens-node/recipe/session';

@Controller()
export class AppController {
  constructor() { }

  @Get()
  sanityCheck(): string {
    return "The True Impact server is live!"
  }

  @Get('/sessioninfo')
  @UseGuards(new AuthGuard())
  getSessionInfo(
    @Session() session: session.SessionContainer,
  ): Record<string, unknown> {
    return {
      sessionHandle: session.getHandle(),
      userId: session.getUserId(),
      accessTokenPayload: session.getAccessTokenPayload(),
    };
  }
}
