import { NonEmptyString } from 'src/libs/data-types';

export class LogInRequestDto {
  @NonEmptyString({
    label: 'username',
    description: `identifies you uniquely within the system`,
  })
  username: string;

  @NonEmptyString({
    label: 'password',
    description: 'your credentials',
  })
  password: string;
}
