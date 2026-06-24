import { NonEmptyString } from '../../../libs/data-types';
import { FLAG_AGGREGATE_TYPE } from '../constants';

export class FlagCompositeIdentifier {
  @NonEmptyString({
    label: 'type',
    description: FLAG_AGGREGATE_TYPE,
  })
  readonly type = FLAG_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'system identifier for this flag',
  })
  id: string;
}
