import { Inject } from '@nestjs/common';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from 'src/libs/data-types';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IUserCommandRepository } from '../repositories';
import { DeactivateUser } from './deactivate-user.command';

export class DeactivateUserCommandHandler implements ICommandHandler<DeactivateUser> {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  async handle(fsa: { payload: DeactivateUser }): Promise<CommandResult> {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
      },
    } = fsa;

    /**
     * You also shouldn't be able to deactivate a lone admin user. But
     * we can always manually append a `USER_REACTIVATED` in the DB to
     * recover from this situation, so we avoid complicated validation of
     * that situation here.
     */
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
