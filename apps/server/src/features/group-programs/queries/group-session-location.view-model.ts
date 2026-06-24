import { NonEmptyString } from '../../../libs/data-types';

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
}
