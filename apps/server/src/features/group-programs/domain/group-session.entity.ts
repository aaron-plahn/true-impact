import {
  Entity,
  NestedDataType,
  NonEmptyString,
  TrueImpactError,
} from '../../../libs/data-types';
import { GroupProgramObservation } from '../queries/group-program-observation.entity';
import {
  GroupSessionLocation,
  GroupSessionLocationDto,
} from './group-session-location.value-object';

export class GroupSessionPersistenceDto {
  id: string;

  location: GroupSessionLocationDto;
}

export class GroupSession extends Entity {
  // Do we really need this?
  @NonEmptyString({
    label: 'ID',
    description:
      // i.e., it's a local identifier. Sessions of other programs may have the same ID.
      'uniquely identifies this session amongst other sessions of the same program',
  })
  id: string;

  @NestedDataType(() => GroupSessionLocation, {
    label: 'location',
    description: 'location where this group session takes place',
  })
  location: GroupSessionLocation;

  // TODO use proper dates
  @NonEmptyString({
    label: 'date',
    description: 'the date this group session takes place',
  })
  date: string;

  @NestedDataType(() => GroupProgramObservation, {
    label: 'observations',
    description:
      'a list of all observations (notes or classifications by interaction type) of group sessions',
  })
  observations: GroupProgramObservation[];

  constructor({
    id,
    location,
    date,
    observations,
  }: {
    id: string;
    location: GroupSessionLocation;
    date: string;
    observations: GroupProgramObservation[];
  }) {
    super();

    this.id = id;

    this.location = location;

    this.date = date;

    this.observations = observations;
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErorrs: TrueImpactError[] = [];

    // TODO do this automatically based on the schema
    const locationValidationResult = this.location.validateInvariants();

    if (locationValidationResult instanceof Error) {
      allErorrs.push(locationValidationResult);
    }

    return allErorrs;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.id;
  }

  toPersistenceDto(): GroupSessionPersistenceDto {
    return {
      id: this.id,
      location: this.location.toPersistenceDto(),
    };
  }

  static schedule({
    id,
    date,
    location,
  }: {
    id: string;
    date: string;
    location: GroupSessionLocationDto;
  }): GroupSession | TrueImpactError {
    const locationBuildResult = GroupSessionLocation.fromUserRequest(location);

    if (locationBuildResult instanceof Error) {
      return locationBuildResult;
    }

    const instance = new GroupSession({
      id,
      date,
      location: locationBuildResult,
      // a session must be scheduled prior to making observations
      observations: [],
    });

    const sessionBuildResult = instance.validateInvariants();

    return sessionBuildResult;
  }
}
