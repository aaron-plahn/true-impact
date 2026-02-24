import session from 'supertokens-node/recipe/session';
import { AuthGuard } from './auth/auth.guard';
import { Session } from './auth/session.decorator';
import { Controller, Get, UseGuards } from './libs/framework';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  sanityCheck(): string {
    return 'The True Impact server is live!';
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
