import { Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import SessionRecipe, {
  SessionContainer,
} from 'supertokens-node/recipe/session';
import {
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  NonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../libs/data-types';
import { ApiBody, Body, Controller, Post } from '../libs/framework';
import { AuthGuard } from './guards';
import { LogInRequestDto } from './log-in-request.dto';

export class SessionInfoForAuthenticatedUser {
  @NonEmptyString({
    label: 'username',
    description: 'name of the currently authenticated user',
  })
  username: string;
}

@Controller('auth')
export class AuthController {
  constructor() {}

  @Post('signin')
  @ApiBody({
    schema: convertToOpenApiSchema(getDataSchemaFromClassCtor(LogInRequestDto)),
  })
  async logIn(
    // TODO fuzz \ type test
    @Body() body: LogInRequestDto,
    // TODO adapt to our own API
    // LogInRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { username, password } = body;

    // We won't hit this because the DTO is validated by Supertoken's middleware before we get here
    if (!username || !password) {
      throw new UnauthorizedException();
    }

    const result = await EmailPassword.signIn('public', username, password);

    if (result.status === 'WRONG_CREDENTIALS_ERROR') {
      throw new UnauthorizedException();
    }

    // if (result === 'MFA required') {
    //   return {
    //     message: 'MFA Required',
    //   };
    // }

    const { recipeUserId: userId } = result;

    // This is just in case our type safety fails some how here and some unexpected type slips thorugh.
    if (!userId) {
      throw new UnauthorizedException();
    }

    const session = await SessionRecipe.createNewSession(
      req,
      res,
      // TODO export a const "DEFAULT_TENANT_ID"
      'public',
      userId,
      // these are not necessary for our use case
      // jwtPayload,
      // customSessionData,
    );

    if (!session) {
      throw new Error(`Missing session for login.`);
    }

    return 'success';
  }

  @Post('signout')
  // A session must exist to log out.
  @UseGuards(new AuthGuard())
  async logOut(
    @Req() req: Request,
    @Res({ passthrough: true }) _res: Response,
  ) {
    const session = req['session'] as unknown as SessionContainer;

    if (!session) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot log out as you are not currently logged in.`,
        ),
      ]);
    }

    await session.revokeSession().catch((err) => {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to destroy user session in order to log out`,
        ),
        new TrueImpactError(
          (err as { message: string })?.message || 'Unknown internal error',
        ),
      ]);
    });

    return {
      message: 'success',
    };
  }
}
