import { EncryptionService } from 'src/libs/auth';
import { CommandResult } from 'src/libs/cqrs-es';
import { TrueImpactError } from 'src/libs/data-types';
import { Inject } from '../../../libs/framework';
import { TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { ITiSystemUserCommandRepository } from '../repositories';
import { TiSystemUser } from '../ti-system-user.aggregate-root';
import { CreateUser } from './create-user.command';

// TODO implements ICommandHandler<CreateUser>
export class CreateUserCommandHandler {
  constructor(
    @Inject(TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ITiSystemUserCommandRepository,
    private readonly cryptoService: EncryptionService,
  ) {}

  async handle({ payload }: { payload: CreateUser }): Promise<CommandResult> {
    // TODO validate password strength
    const { password, username, email, firstName, lastName } = payload;

    const hashedPassword = this.cryptoService.encrypt(password);

    const buildResult = TiSystemUser.fromUserRequest({
      hashedPassword,
      username,
      email,
      // should we combine these here first?
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
