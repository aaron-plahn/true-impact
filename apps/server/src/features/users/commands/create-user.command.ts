import { TrueImpactDataExample } from '../../../libs/data-types';

@TrueImpactDataExample<CreateUser>({
  example: {
    username: 'sysuser1221',
    email: 'sysuser@somedomain.org',
    firstName: 'Sarah',
    lastName: 'Sysuser',
  },
})
export class CreateUser {
  static readonly type = 'CREATE_USER';

  username: string;

  // TODO verification flow
  email: string;

  firstName: string;

  // middle name

  lastName: string;

  // hashedPassword

  // hashedMfaCode
}
