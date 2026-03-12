import { NestedDataType, NonEmptyString } from '../../../libs/data-types';
import { COMMUNITY_AGGREGATE_TYPE } from '../constants';

export class CommunityCompositeIdentifier {
  readonly type = COMMUNITY_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'id',
    description: 'system identifier for this community',
  })
  id: string;
}

export const CommunityCompositeIdentifierDataProperty = NestedDataType(
  () => CommunityCompositeIdentifier,
  {
    label: 'composite identifier',
    description: 'system-wide unique identifier for this community',
  },
);
