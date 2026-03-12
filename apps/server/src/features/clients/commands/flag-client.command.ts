import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { ClientCompositeIdentifier } from '../client.composite-identifier';

@TrueImpactDataExample<FlagClient>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'client',
      id: '55',
    },
    flagId: '101',
  },
})
export class FlagClient {
  static readonly type = 'FLAG_CLIENT';

  @NestedDataType(() => ClientCompositeIdentifier, {
    label: 'composite ID',
    description: 'system-wide unique identifier for the client being flagged',
  })
  aggregateCompositeIdentifier: ClientCompositeIdentifier;

  @NonEmptyString({
    label: 'flag ID',
    description:
      'a system reference to the flag you are applying for this client',
  })
  // @ReferenceTo(FLAG_AGGREGATE_TYPE)
  flagId: string;
}
