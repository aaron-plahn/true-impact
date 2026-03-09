import { NonEmptyString } from 'src/libs/data-types';
import { FLAG_AGGREGATE_TYPE } from '../constants';

export class FlagCompositeIdentifier {
  readonly type = FLAG_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'system identifier for this flag',
  })
  id: string;
}
