import { NonEmptyString } from '../../../libs/data-types';
import { GroupSession } from '../domain/group-session.entity';
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

  constructor({
    id,
    location,
  }: {
    id: string;
    location: GroupSessionLocationViewModel;
  }) {
    this.id = id;

    this.location = location;
  }

  static fromDomainModel(
    domainGroupSession: GroupSession,
  ): GroupSessionViewModel {
    const { id, location: domainLocation } = domainGroupSession;

    const location =
      GroupSessionLocationViewModel.fromDomainModule(domainLocation);

    return new GroupSessionViewModel({
      id,
      location,
    });
  }
}
