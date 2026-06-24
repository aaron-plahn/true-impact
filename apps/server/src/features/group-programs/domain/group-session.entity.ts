import {
  Entity,
  NestedDataType,
  NonEmptyString,
  TrueImpactError,
} from '../../../libs/data-types';
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

  constructor({
    id,
    location,
    date,
  }: {
    id: string;
    location: GroupSessionLocation;
    date: string;
  }) {
    super();

    this.id = id;

    this.location = location;

    this.date = date;
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
    });

    const sessionBuildResult = instance.validateInvariants();

    if (sessionBuildResult instanceof Error) {
      console.log('Oh no!');
    }

    return sessionBuildResult;
  }
}
