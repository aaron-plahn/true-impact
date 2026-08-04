import {
  Literal,
  NestedDataType,
  NonEmptyString,
} from '../../../libs/data-types';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from './constants';

export const GroupProgramCompositeIdentifierValuedProperty = NestedDataType(
  () => GroupProgramCompositeIdentifier,
  {
    label: 'composite ID',
    description: 'system-wide unique identifier for this group program',
  },
);

export class GroupProgramCompositeIdentifier {
  @Literal(GROUP_PROGRAM_AGGREGATE_TYPE, {
    label: 'type',
    description: GROUP_PROGRAM_AGGREGATE_TYPE,
  })
  type = GROUP_PROGRAM_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'System identifier for this group program',
  })
  id: string;
}
