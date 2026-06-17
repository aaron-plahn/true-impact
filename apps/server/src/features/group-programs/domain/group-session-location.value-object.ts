import {
  Entity,
  isNonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
} from 'src/libs/data-types';

export class GroupSessionLocationDto {
  communityId?: string;

  name?: string;

  isUrban?: boolean;
}

@TrueImpactDataExample<GroupSessionLocationDto>({
  example: {
    // all props are optional, but combinations are constrained
  },
})
/**
 * We need to consider our inheritance here. The present class may just be a
 * value object. It's possible that we duplicate invariant validation base logic
 * for a separate base `ValueObject` akin to `Entity` without opting into other
 * entity-specific behaviour.
 */
export class GroupSessionLocation extends Entity {
  // geospatialCoordinates?

  communityId?: string;

  name?: string;

  isUrban?: boolean;

  constructor({ communityId, name, isUrban }: GroupSessionLocationDto) {
    super();

    this.communityId = communityId;

    this.name = name;

    this.isUrban = isUrban;
  }

  /**
   * If specifying a community, no other props should be provided.
   *
   * If specifying a name, isUrban must be provided.
   *
   * If specifying geospatialCoordinates, no other properties should be provided.
   */
  validateComplexInvariants(): TrueImpactError[] {
    const errors: TrueImpactError[] = [];

    const isLocationEmpty = this.isEmpty();

    if (isLocationEmpty) {
      const e = new TrueImpactError(
        `Inconsistent location definition. A group session location must be specified either by \n1.community or by \n2. name and urban / rural`,
      );

      console.log({ returning: e });

      return [e];
    }

    if (isNonEmptyString(this.communityId)) {
      // TODO validate schema using decorators
      if (this.name !== null && typeof this.name !== 'undefined') {
        errors.push(
          new TrueImpactError(
            `The name and a community ID cannot both be specified for a group session location, as this could lead to inconsistencies.`,
          ),
        );
      }
    }

    return errors;
  }

  toPersistenceDto(): GroupSessionLocationDto {
    return {
      communityId: this.communityId,
      name: this.name,
      isUrban: this.isUrban,
    };
  }

  isEmpty(): boolean {
    // note that empty-strings are equivalent to null \ undefined values for string-valued props here
    return !this.communityId && typeof this.isUrban !== 'boolean' && !this.name;
  }

  static fromPersistenceDto(dto: GroupSessionLocationDto) {
    return new GroupSessionLocation(dto);
  }

  getId(): string {
    if (isNonEmptyString(this.communityId)) {
      return `community/${this.communityId}`;
    }

    if (isNonEmptyString(this.name)) {
      return this.name;
    }

    // This will only happen in case invariant validation fails.
    return 'UNKNOWN LOCATION';
  }

  getName(): string {
    return this.getId();
  }
}
