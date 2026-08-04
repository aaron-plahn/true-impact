import { Literal, NonEmptyString } from '../../libs/data-types';
import { USER_AGGREGATE_TYPE } from './constants';

export class UserCompositeIdentifier {
  @Literal(USER_AGGREGATE_TYPE, {
    label: 'user',
    description: 'user',
  })
  type = USER_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'system identifier for this user',
  })
  id: string;
}
