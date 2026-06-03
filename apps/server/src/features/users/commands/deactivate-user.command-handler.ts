import { Inject } from '@nestjs/common';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from 'src/libs/data-types';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import { TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { ITiSystemUserCommandRepository } from '../repositories';
import { DeactivateTiSystemUser } from './deactivate-user.command';

export class DeactivateUserCommandHandler implements ICommandHandler<DeactivateTiSystemUser> {
  constructor(
    @Inject(TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: ITiSystemUserCommandRepository,
  ) {}

  async handle(fsa: {
    payload: DeactivateTiSystemUser;
  }): Promise<CommandResult> {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
      },
    } = fsa;

    const target = await this.userCommandRepository.fetchById(id);

    if (!target) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot deactivate user: [${id}], as there is no such user.`,
        ),
      ]);
    }

    const updateResult = target.deactivate();

    if (updateResult instanceof Error) {
      return updateResult;
    }

    const persistenceResult =
      await this.userCommandRepository.update(updateResult);

    return persistenceResult;
  }
}
