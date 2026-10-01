import {
  Literal,
  NestedDataType,
  NonEmptyString,
} from '../../../libs/data-types';
import { COMMUNITY_AGGREGATE_TYPE } from '../constants';

export const CommunityCompositeIdentifierValuedProp = NestedDataType(
  () => CommunityCompositeIdentifier,
  {
    label: 'composite ID',
    description: `system-wide unique identifier for a community`,
  },
);

export class CommunityCompositeIdentifier {
  @Literal(COMMUNITY_AGGREGATE_TYPE, {
    label: 'type',
    description: COMMUNITY_AGGREGATE_TYPE,
  })
  readonly type = COMMUNITY_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'id',
    description: 'system identifier for this community',
  })
  id: string;
}
