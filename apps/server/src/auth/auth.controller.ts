import { Session, UnauthorizedException } from '@nestjs/common';
import { UserAuthenticationService } from 'src/features/users/user-authentication.service';
import { Body, Controller, Post } from '../libs/framework';
import { LogInRequestDto } from './log-in-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userAuthService: UserAuthenticationService) {}

  @Post('logIn')
  async logIn(
    @Body() { username, password }: LogInRequestDto,
    @Session() session: Record<string, unknown>,
  ) {
    throw new UnauthorizedException();

    const result = await this.userAuthService.logIn(username, password);

    if (result === 'success') {
      session.username = username;

      return {
        message: 'success',
      };
    }

    if (result === 'unauhtorized') {
      // TODO use returned errors?
      throw new UnauthorizedException();
    }

    if (result === 'MFA required') {
      return {
        message: 'MFA Required',
      };
    }

    // TODO exhaustive check
  }

  @Post('logOut')
  async logOut() {
    const result = await this.userAuthService.logOut();

    if (result === 'unauthorized') {
      throw new UnauthorizedException();
    }

    if (result === 'success') {
      return {
        message: 'success',
      };
    }
  }
}
