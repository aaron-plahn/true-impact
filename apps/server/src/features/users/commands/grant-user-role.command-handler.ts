import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { ITiSystemUserCommandRepository } from '../repositories';
import { GrantUserRole } from './grant-user-role.command';

export class GrantUserRoleCommandHandler implements ICommandHandler<GrantUserRole> {
  constructor(
    @Inject(TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: ITiSystemUserCommandRepository,
  ) {}

  async handle(fsa: { payload: GrantUserRole }): Promise<CommandResult> {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
        role,
      },
    } = fsa;

    const target = await this.userCommandRepository.fetchById(id);

    if (!target) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot grant role: [${role}] to the user with ID: [${id}], as there is no user with that ID.`,
        ),
      ]);
    }

    const updateResult = target.grantUserRole(role);

    if (updateResult instanceof Error) {
      return updateResult;
    }

    const persistenceResult =
      await this.userCommandRepository.update(updateResult);

    return persistenceResult;
  }
}
