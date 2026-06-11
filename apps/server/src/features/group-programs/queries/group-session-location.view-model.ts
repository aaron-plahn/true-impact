/**
 * Note that the domain allows users to either use
 * 1. a community ID
 * 2. a name + isUrban combo
 * 3. direct geospatial coordinates (future scoped)
 *
 * But the view doesn't care about the distinction.
 */
export class GroupSessionLocationViewModel {
  name: string;
  isUrban: boolean;
  // geospatialCoordinates? // we can add this for mapping utilities
}
