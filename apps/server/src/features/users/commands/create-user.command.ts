import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';

@TrueImpactDataExample<CreateUser>({
  example: {
    username: 'sysuser1221',
    email: 'sysuser@somedomain.org',
    firstName: 'Sarah',
    lastName: 'Sysuser',
    password: 'verySECURE1',
  },
})
// CREATE_USER_WITH_PASSWORD?
export class CreateUser {
  static readonly type = 'CREATE_USER';

  @NonEmptyString({
    label: 'username',
    description: 'user-friendly system ID for the new user',
  })
  username: string;

  // TODO verification flow
  @NonEmptyString({
    label: 'email',
    description: 'primary email for system communications',
  })
  email: string;

  @NonEmptyString({
    label: 'first name',
    description: `the new user's given first name`,
  })
  firstName: string;

  // middle name

  @NonEmptyString({
    label: 'last name',
    description: `the new user's given surname`,
  })
  lastName: string;

  @NonEmptyString({
    label: 'password',
    description: `initial user password`,
  })
  // if we decide to persist commands, we must remove or hash this property
  // This is hashed before persisting to the DB
  password: string;
}
