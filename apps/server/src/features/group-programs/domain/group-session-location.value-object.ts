import {
  BooleanDataType,
  Entity,
  isBoolean,
  isNonEmptyString,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../../libs/data-types';

export class GroupSessionLocationDto {
  @NonEmptyString({
    label: 'community',
    description: 'community where this session will take place (if relevant)',
    isOptional: true,
  })
  communityId?: string;

  @NonEmptyString({
    label: 'name',
    description: 'name of the location',
    isOptional: true,
  })
  name?: string;

  @BooleanDataType({
    label: 'is urban',
    description:
      'is this location urban (if not, it is considered in-community)',
    isOptional: true,
  })
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

  @NonEmptyString({
    label: 'community',
    description: 'community where this session will take place (if relevant)',
    isOptional: true,
  })
  communityId?: string;

  @NonEmptyString({
    label: 'name',
    description: 'name of the location',
    isOptional: true,
  })
  name?: string;

  @BooleanDataType({
    label: 'is urban',
    description:
      'is this location urban (if not, it is considered in-community)',
    isOptional: true,
  })
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

      return [e];
    }

    if (isNonEmptyString(this.communityId)) {
      errors.push(
        new TrueImpactError(
          `Specifying group session locations by community is not yet supported.`,
        ),
      );

      // TODO validate schema using decorators
      if (this.name !== null && typeof this.name !== 'undefined') {
        errors.push(
          new TrueImpactError(
            `The name and a community ID cannot both be specified for a group session location, as this could lead to inconsistencies.`,
          ),
        );
      }
    } else {
      // we know that communityId is omitted
      if (!this.name) {
        errors.push(
          new TrueImpactError(
            `You must specify the [name] of a group session location when not specifying a community by ID.`,
          ),
        );
      }

      if (!isBoolean(this.isUrban)) {
        errors.push(
          new TrueImpactError(
            `You must specify [isUrban] for a group session location when not specifying a community by ID.`,
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

  static fromUserRequest(
    dto: GroupSessionLocationDto,
  ): GroupSessionLocation | TrueImpactError {
    return new GroupSessionLocation(dto).validateInvariants();
  }

  static fromPersistenceDto(
    dto: GroupSessionLocationDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): GroupSessionLocation | TrueImpactError {
    const instance = new GroupSessionLocation(dto);

    if (buildOptions?.shouldValidate) {
      return instance.validateInvariants();
    }

    return instance;
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
