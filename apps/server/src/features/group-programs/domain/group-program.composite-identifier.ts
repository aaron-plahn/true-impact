import { NonEmptyString } from '../../../libs/data-types';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from './constants';

export class GroupProgramCompositeIdentifier {
  type = GROUP_PROGRAM_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'System identifier for this group program',
  })
  id: string;
}
