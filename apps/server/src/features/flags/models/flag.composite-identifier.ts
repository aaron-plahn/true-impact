import { Literal, NonEmptyString } from '../../../libs/data-types';
import { FLAG_AGGREGATE_TYPE } from '../constants';

export class FlagCompositeIdentifier {
  @Literal(FLAG_AGGREGATE_TYPE, {
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
