import { Inject } from '@nestjs/common';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SupertokensAuthService } from '../../../auth';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../constants';
import type { IUserCommandRepository } from '../../repositories';
import { DeactivateUser } from './deactivate-user.command';

export class DeactivateUserCommandHandler implements ICommandHandler<DeactivateUser> {
  constructor(
    private readonly authService: SupertokensAuthService,
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
     *
     * What if we make this a no-op in case we have a lone admin user?
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

    if (persistenceResult instanceof Error) {
      return persistenceResult;
    }

    /**
     * We have test coverage in `username-password-authentication.scenario.ts`.
     *
     * We should add an `integration` test where we put the auth service down
     * and check that the appropriate error message is returned.
     */
    const authProviderDeactivationResult = await this.authService.delete(id);

    /**
     * The auth service is out-of-process with our internal user service. As such,
     * we opt for the failure state where the user is deactivated in our database,
     * though active in the auth provider. Our auth middleware will return no user in this case.
     *
     * We choose this failure state over the alternative because we don't want the user to be visible to
     * other users. Also, this approach allows us to move to an outbox pattern within our own users (domain) database
     * instead of the supertokens DB, which is harder to customize.l
     *
     * We should resolve this using eventually consistent notifications. Alternatively,
     * we could use an outbox pattern in the auth DB where the command deletes the user and writes
     * to an outbox in the auth DB transactionally. A second process would pull from this outbox
     * and delete the user within our system. We will opt for the former as this situation
     * should be exceedingly rare given that we will have a small number of users that are rarely deactivated
     * for our current use-case.
     */
    if (authProviderDeactivationResult instanceof Error) {
      return authProviderDeactivationResult;
    }

    return persistenceResult;
  }
}
