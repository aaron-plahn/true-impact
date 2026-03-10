import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { FLAG_AGGREGATE_TYPE } from '../constants';
import { FlagCompositeIdentifier } from '../models';

@TrueImpactDataExample<RelabelFlag>({
  example: {
    aggregateCompositeIdentifier: {
      type: FLAG_AGGREGATE_TYPE,
      id: '555',
    },
    newLabel: 'Vicious Pet Owner',
  },
})
export class RelabelFlag {
  static readonly type = 'RELABEL_FLAG';

  @NestedDataType(() => FlagCompositeIdentifier, {
    label: 'composite ID',
    description: 'system-wide unique identifier for this flag',
  })
  aggregateCompositeIdentifier: FlagCompositeIdentifier;

  @NonEmptyString({
    label: 'new label',
    description: 'this label will replace the old label for this flag',
  })
  newLabel: string;

  // langaugeCode
}
