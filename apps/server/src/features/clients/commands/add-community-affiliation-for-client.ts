import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import { ClientCompositeIdentifier } from '../client.composite-identifier';

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
