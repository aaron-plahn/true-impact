import { NotImplementedException } from '@nestjs/common';
import { isBoolean, NonEmptyString } from '../../../libs/data-types';
import { GroupSessionLocation } from '../domain/group-session-location.value-object';

/**
 * Note that the domain allows users to either use
 * 1. a community ID
 * 2. a name + isUrban combo
 * 3. direct geospatial coordinates (future scoped)
 *
 * But the view doesn't care about the distinction.
 */
export class GroupSessionLocationViewModel {
  @NonEmptyString({
    label: 'name',
    description: 'name',
  })
  name: string;

  @NonEmptyString({
    label: 'is urban?',
    description:
      'true if this program session took place in an urban setting (not in community)',
  })
  isUrban: boolean;
  // geospatialCoordinates? // we can add this for mapping utilities

  constructor({ name, isUrban }: { name: string; isUrban: boolean }) {
    this.name = name;

    this.isUrban = isUrban;
  }

  static fromDomainModule(domainLocation: GroupSessionLocation) {
    const { communityId, name, isUrban } = domainLocation;

    if (communityId || !name || !isBoolean(isUrban)) {
      throw new NotImplementedException(
        `Specifying communities by ID as group session locations is not yet supported`,
      );
    }

    return new GroupSessionLocationViewModel({ name, isUrban });
  }
}
