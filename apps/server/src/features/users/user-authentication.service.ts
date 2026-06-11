import { EncryptionService } from '../../libs/auth';
import { Inject } from '../../libs/framework';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import type { IUserCommandRepository } from './repositories';

type LogInResult = 'unauhtorized' | 'MFA required' | { userId: string };

export class UserAuthenticationService {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
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

  logOut(): Promise<'success' | 'unauthorized'> {
    return Promise.resolve('success');
  }
}
