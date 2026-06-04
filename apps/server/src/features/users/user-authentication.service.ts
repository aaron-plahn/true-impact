import { EncryptionService } from 'src/libs/auth';
import { Inject } from '../../libs/framework';
import { TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import type { ITiSystemUserCommandRepository } from './repositories';

type LogInResult = 'unauhtorized' | 'MFA required' | { userId: string };

export class UserAuthenticationService {
  constructor(
    @Inject(TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: ITiSystemUserCommandRepository,
    private readonly cryptoService: EncryptionService,
  ) {}

  async logIn(username: string, password: string): Promise<LogInResult> {
    const hashedPassword = this.cryptoService.encrypt(password);

    const fetchResult = await this.userCommandRepository.fetchByCredentials({
      username,
      hashedPassword,
    });

    if (!fetchResult) {
      return 'unauhtorized';
    }

    // should this be a user ID for the session?
    return { userId: fetchResult.id };
  }

  //   redeemMfaToken(_passcode: string): Promise<'success' | 'unauthorized'> {
  //     return Promise.resolve('unauthorized');
  //   }

  //   // Link?
  //   requestPasswordReset(): Promise<{ code: string } | 'unauthorized'> {
  //     return Promise.resolve('unauthorized');
  //   }

  //   resetPassword(_resetInfo: {
  //     newPassword: string;
  //     resetCode: string;
  //   }): Promise<'success' | 'unauthorized'> {
  //     return Promise.resolve('unauthorized');
  //   }

  logOut(): Promise<'success' | 'unauthorized'> {
    return Promise.resolve('success');
  }
}
