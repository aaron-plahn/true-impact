import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import { FlagCompositeIdentifier } from '../models';

export class RelabelFlag {
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
