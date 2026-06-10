import { EncryptionService } from '../../../libs/auth';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import { TrueImpactError } from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IUserCommandRepository } from '../repositories';
import { User } from '../user.aggregate-root';
import { CreateUserWithPassword } from './create-user-with-password.command';

export class CreateUserWithPasswordCommandHandler implements ICommandHandler<CreateUserWithPassword> {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: IUserCommandRepository,
    private readonly cryptoService: EncryptionService,
  ) {}

  async handle({
    payload,
  }: {
    payload: CreateUserWithPassword;
  }): Promise<CommandResult> {
    // TODO validate password strength
    const { password, username, email, firstName, lastName } = payload;

    const hashedPassword = this.cryptoService.encrypt(password);

    const buildResult = User.fromUserRequest({
      hashedPassword,
      username,
      email,
      firstName,
      lastName,
    });

    if (buildResult instanceof TrueImpactError) {
      return Promise.resolve(buildResult);
    }

    const persistenceResult = await this.repository.create(buildResult);

    return persistenceResult;
  }
}
