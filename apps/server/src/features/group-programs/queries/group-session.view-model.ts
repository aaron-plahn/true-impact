import {
  deepConvertMapToObject,
  LookupTable,
  NonEmptyString,
} from '../../../libs/data-types';
import { GroupSession } from '../domain/group-session.entity';
import { GroupProgramObservation } from './group-program-observation.entity';
import { GroupProgramObservationViewModel } from './group-program-observation.view-model';
import {
  GroupSessionLocationViewModel,
  GroupSessionLocationViewModelClientDto,
} from './group-session-location.view-model';

export class GroupSessionViewModelClientDto {
  id: string;

  date: string;

  observationsById: Record<string, GroupProgramObservationViewModel>;

  location: GroupSessionLocationViewModelClientDto;
}

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

  @NonEmptyString({
    label: 'date',
    description: 'date this session takes place',
  })
  // TODO update this format
  date: string;

  @LookupTable(() => GroupProgramObservation, {
    label: 'observations',
    description:
      'a list of all observations (notes or classified interactions) made for this group session',
  })
  /**
   * The local identifier should be a timestamp here.
   */
  observationsById: Map<string, GroupProgramObservationViewModel>;

  constructor({
    id,
    location,
    date,
    observationsById,
  }: {
    id: string;
    location: GroupSessionLocationViewModel;
    date: string;
    observationsById: Map<string, GroupProgramObservationViewModel>;
  }) {
    this.id = id;

    this.location = location;

    this.date = date;

    this.observationsById = observationsById;
  }

  toClientDto(): GroupSessionViewModelClientDto {
    return {
      id: this.id,
      date: this.date,
      observationsById: deepConvertMapToObject(this.observationsById),
      location: this.location.toClientDto(),
    };
  }

  static fromDomainModel(
    domainGroupSession: GroupSession,
  ): GroupSessionViewModel {
    const {
      id,
      location: domainLocation,
      date,
      observations,
    } = domainGroupSession;

    const location =
      GroupSessionLocationViewModel.fromDomainModule(domainLocation);

    const observationsById = new Map<
      string,
      GroupProgramObservationViewModel
    >();

    observations.forEach((o, index) => {
      const observationId = index + 1;

      const view = GroupProgramObservationViewModel.fromDomainModel(o);

      observationsById.set(observationId.toString(), view);
    });

    return new GroupSessionViewModel({
      id,
      location,
      date,
      observationsById,
    });
  }
}
