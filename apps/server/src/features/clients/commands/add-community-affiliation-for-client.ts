import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import { ClientCompositeIdentifier } from '../client.composite-identifier';

export class AddCommunityAffiliationForClient {
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
