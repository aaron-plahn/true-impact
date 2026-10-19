import { deleteUser } from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../libs/data-types';

export class SupertokensAuthService {
  async delete(userId: string): Promise<{ id: string } | TrueImpactError> {
    try {
      // Supertokens throws instead of returning recoverable errors, so `OK` is the only possible result here.
      const _result = await deleteUser(userId);

      return { id: userId };
    } catch (error) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(`Failed to remove user [${userId}].`),
        new TrueImpactError(
          (error as { message?: string })?.message ||
            'unknown Supertokens error',
        ),
      ]);
    }
  }

  /**
   * Do we want to expose the password at this level? The admin user shouldn't be aware of
   * any initial placeholder password. We can either
   * 1. Generate a random password in the command handler and not expose this on the command payload.
   * 2. Generate a random password at the present level or lower (Supertokens)?
   */
  async signUp({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ id: string } | TrueImpactError> {
    const signUpResult = await EmailPassword.signUp(
      'public',
      username,
      password,
      /**
       * Note that we don't directly expose this to end users. This method is
       * used in a command handler (only available to admin users). As such,
       * the user on the request is the admin user, not the new user. A newly
       * added users will have to be notified and sign-in to a separate session.
       */
      // session
      // userContext
    );

    if (signUpResult.status !== 'OK') {
      return new TrueImpactError(
        `Failed to register new user with supertokens.`,
      );
    }

    return {
      id: signUpResult.user.id,
    };
  }
}
