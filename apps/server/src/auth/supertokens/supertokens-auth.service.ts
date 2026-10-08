import { TrueImpactError } from 'src/libs/data-types';
import EmailPassword from 'supertokens-node/recipe/emailpassword';

export class SupertokensAuthService {
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
