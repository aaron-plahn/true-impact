import { NonEmptyString } from '../../../libs/data-types';
import { GroupSessionLocationViewModel } from './group-session-location.view-model';

export class GroupSessionViewModel {
  @NonEmptyString({
    label: 'ID',
    // i.e., is a local identifier
    description:
      'uniquely identifies this session amongst other sessions of the same group program',
  })
  id: string;

  @NonEmptyString({
    label: 'location',
    description: 'record describing where this group session took place',
  })
  location: GroupSessionLocationViewModel;
}
