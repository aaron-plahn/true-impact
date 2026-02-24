/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as supertokensRecipeSession from 'supertokens-node/recipe/session';
import { CanActivate, ExecutionContext, Injectable } from '../libs/framework';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly getSessionOptions?: supertokensRecipeSession.VerifySessionOptions,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest();
    const resp = ctx.getResponse();

    /**
     * If the session doesn't exist and {sessionRequired: true} is passed to the AuthGuard constructor (default is true),
     * getSession will throw an error that will be handled by the exception filter, returning a 401 response.
     */

    /**
     * To avoid an error when the session doesn't exist, pass {sessionRequired: false} to the AuthGuard constructor.
     * In this case, req.session will be undefined if the session doesn't exist.
     *
     * We may want to have a separate `OptionalAuthGuard` in case we want to enhance access to private resources for
     * authenticated users but serve minimal amount of information to the public. It's not clear whether we will
     * hit this use case for this project.
     */

    const session = await supertokensRecipeSession.getSession(
      req,
      resp,
      this.getSessionOptions,
    );

    req.session = session;
    return true;
  }
}
