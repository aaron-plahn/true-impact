import {
  Get,
  Inject,
  Req,
  Res,
  Session,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from 'src/features/users/constants';
import type { ITiSystemUserCommandRepository } from 'src/features/users/repositories';
import { UserAuthenticationService } from 'src/features/users/user-authentication.service';
import {
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  NonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { ApiBody, Body, Controller, Post } from '../libs/framework';
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
  constructor(
    private readonly userAuthService: UserAuthenticationService,
    @Inject(TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: ITiSystemUserCommandRepository,
  ) {}

  @Post('logIn')
  @ApiBody({
    schema: convertToOpenApiSchema(getDataSchemaFromClassCtor(LogInRequestDto)),
  })
  async logIn(
    @Body() { username, password }: LogInRequestDto,
    @Req() req: Request,
    @Session() session: Record<string, unknown>,
  ) {
    const result = await this.userAuthService.logIn(username, password);

    if (result === 'unauhtorized') {
      // TODO use returned errors?
      throw new UnauthorizedException();
    }

    if (result === 'MFA required') {
      return {
        message: 'MFA Required',
      };
    }

    const { userId } = result;

    if (!session) {
      throw new Error(`Missing session for login.`);
    }

    try {
      // is this consistent with our internal session type?
      session.userId = userId;
      req.session.save();
    } catch {
      throw Error(
        `Failed to set user ID on user session after successful login.`,
      );
    }

    return 'success';
  }

  @Post('logOut')
  async logOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!req.session.userId) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot log out as you are not currently logged in.`,
        ),
      ]);
    }

    const result = await this.userAuthService.logOut();

    if (result === 'unauthorized') {
      throw new UnauthorizedException();
    }

    if (result === 'success') {
      res.clearCookie('survey-response-session');

      req.session.destroy((err) => {
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

  @Get('session')
  async session(@Session() session: { userId: string }) {
    if (!session) {
      throw new UnauthorizedException();
    }

    /**
     * TODO this should be handled with middleware
     */
    const searchResult = await this.userCommandRepository.fetchById(
      session.userId,
    );

    if (!searchResult) {
      throw new UnauthorizedException();
    }

    return {
      username: searchResult.username,
    };
  }
}
