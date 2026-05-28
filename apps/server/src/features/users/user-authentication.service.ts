type LogInResult = 'unauhtorized' | 'MFA required' | 'success';

export class UserAuthenticationService {
  logIn(_username: string, _password: string): Promise<LogInResult> {
    return Promise.resolve('unauhtorized');
  }

  //   redeemMfaToken(_passcode: string): Promise<'success' | 'unauthorized'> {
  //     return Promise.resolve('unauthorized');
  //   }

  //   // Link?
  //   requestPasswordReset(): Promise<{ code: string } | 'unauthorized'> {
  //     return Promise.resolve('unauthorized');
  //   }

  //   resetPassword(_resetInfo: {
  //     newPassword: string;
  //     resetCode: string;
  //   }): Promise<'success' | 'unauthorized'> {
  //     return Promise.resolve('unauthorized');
  //   }

  logOut(): Promise<'success' | 'unauthorized'> {
    return Promise.resolve('unauthorized');
  }
}
