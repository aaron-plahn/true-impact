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
      // session ?
      // userContext ?
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
