import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { ClientCompositeIdentifier } from '../client.composite-identifier';

@TrueImpactDataExample<AddCommunityAffiliationForClient>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'client',
      id: '3',
    },
    communityId: '444',
  },
})
export class AddCommunityAffiliationForClient {
  static readonly type = 'ADD_COMMUNITY_AFFILIATION_FOR_CLIENT';

  @NestedDataType(() => ClientCompositeIdentifier, {
    label: 'composite ID',
    description: 'system-wide unique reference to this client',
  })
  aggregateCompositeIdentifier: ClientCompositeIdentifier;

  @NonEmptyString({
    label: 'community ID',
    description:
      'a reference to the community to which this client is registered',
  })
  communityId: string;
}
