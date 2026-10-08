import { SupertokensAuthService } from 'src/auth';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import { TrueImpactError } from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IUserCommandRepository } from '../repositories';
import { User } from '../user.aggregate-root';
import { CreateUserWithPassword } from './create-user-with-password.command';

export class CreateUserWithPasswordCommandHandler implements ICommandHandler<CreateUserWithPassword> {
  constructor(
    private readonly authService: SupertokensAuthService,
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: IUserCommandRepository,
  ) {}

  async handle({
    payload,
  }: {
    payload: CreateUserWithPassword;
  }): Promise<CommandResult> {
    // TODO validate password strength
    const { password, username, email, firstName, lastName } = payload;

    /**
     * Be warned that what Supertoken's `EmailPassword` recipe calls `email` is
     * actually an immutable user identifier. We follow their recommendation in
     * passing `Supertokens` the user's `username` instead of `email` and manage emails
     * within our own user DB.
     *
     * Also note that the creation of the user in Supertokens and the persistence of the user
     * in our database **can not** be transactional. As such, we create the user in Supertokens first. This means
     * the possible anomalous state (due to the process terminating before writing to our own database) is as follows.
     * There will be a user with the given `username` in the database but this user will not be found within our system.
     * In this case, we should prevent the user from logging in via the client. We should have some automated alert that
     * notifies us that this has occurred. Finally, we should introduce a compensating `UserDiscoveredInSupertokens` event
     * to correct for this situation.
     */
    const providerRegistrationResult = await this.authService.signUp({
      username,
      password,
    });

    if (providerRegistrationResult instanceof Error) {
      return providerRegistrationResult;
    }

    const { id } = providerRegistrationResult;

    const buildResult = User.fromUserRequest({
      username,
      email,
      firstName,
      lastName,
      /**
       * TODO use a random uuid and append an `AuthToken`?
       */
      id,
    });

    if (buildResult instanceof TrueImpactError) {
      return Promise.resolve(buildResult);
    }

    const persistenceResult = await this.repository.create(buildResult);

    return persistenceResult;
  }
}
