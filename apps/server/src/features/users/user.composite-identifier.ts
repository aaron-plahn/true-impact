import { NonEmptyString } from '../../libs/data-types';
import { USER_AGGREGATE_TYPE } from './constants';

export class UserCompositeIdentifier {
  // Or can we make this static or a getter? It shouldn't be required from the outside.
  // TODO @Literal
  @NonEmptyString({
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
