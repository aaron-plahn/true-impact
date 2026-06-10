import {
  CreateUserWithPassword,
  GrantUserRole,
} from '../../../features/users/commands';
import { UserRole } from '../../../features/users/types';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { TrueImpactDataExample } from '../../../libs/data-types';
import { assertCommandError } from './assert-command-error';
import { assertCommandScenarioSuccess } from './assert-command-scenario-success';
import { signIn, signInAsAdmin } from './sign-in';
import { TestHttpClient } from './test-http-client';

type AssertCommandAccessDeniedToUserTestCase = {
  user?: {
    credentials: {
      username: string;
      password: string;
    };
    role: UserRole;
  };
  endpoint: string;
};

@TrueImpactDataExample<ToyCommand>({
  example: {
    payload: {
      foo: 3,
    },
  },
})
class ToyCommand {
  static readonly type = 'TOY_COMMAND';

  payload: {
    foo: number;
  };
}

export const assertCommandAccessDeniedToUser = async (
  testCase: AssertCommandAccessDeniedToUserTestCase,
) => {
  const { user, endpoint } = testCase;

  const httpClientForUserRequests = new TestHttpClient('http://localhost:4200');

  if (user) {
    const httpClientForAdminRequests = new TestHttpClient(
      'http://localhost:4200',
    );

    await signInAsAdmin(httpClientForAdminRequests);

    await httpClientForAdminRequests.patch(
      'http://localhost:3234/users/test-setup',
    );

    const stream = TestCommandStream.first(CreateUserWithPassword, {
      ...user.credentials,
    });

    await assertCommandScenarioSuccess({
      endpoint: 'http://localhost:3234/users/commands',
      stream:
        user.role === 'employee'
          ? stream
          : stream.andThen(GrantUserRole, {
              role: user.role,
            }),
      httpClient: httpClientForAdminRequests,
    });

    await signIn(user.credentials, httpClientForUserRequests);
  }

  await assertCommandError({
    httpClient: httpClientForUserRequests,
    endpoint,
    commandFsa: TestCommandStream.buildOne(ToyCommand, {}),
    assertErrorMessageAsExpected: (message) => {
      expect(message).toContain('Forbidden');
    },
  });
};
