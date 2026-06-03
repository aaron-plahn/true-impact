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
  ) {}

  async handle({ payload }: { payload: CreateUser }): Promise<CommandResult> {
    const buildResult = TiSystemUser.fromUserRequest(payload);

    if (buildResult instanceof TrueImpactError) {
      return Promise.resolve(buildResult);
    }

    const persistenceResult = await this.repository.create(buildResult);

    return persistenceResult;
  }
}
