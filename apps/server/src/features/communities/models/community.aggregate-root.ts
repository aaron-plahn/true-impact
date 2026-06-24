import {
  MultilingualText,
  MultilingualTextItemRole,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import {
  AggregateRoot,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../../libs/data-types';
import { CreateCommunity } from '../commands/create-community.command';
import { COMMUNITY_AGGREGATE_TYPE } from '../constants';

export class CommunityPersistenceDto {
  id: string;

  bandNumber: string;

  revision: number;

  name: MultilingualTextPersistenceDto;

  nation: string;
}

@TrueImpactDataExample<CommunityPersistenceDto>({
  example: {
    id: '123',
    bandNumber: '711',
    revision: 2,
    nation: 'River People',
    name: {
      items: {
        en: {
          [MultilingualTextItemRole.original]: {
            text: 'Pink Sky',
          },
        },
      },
    },
  },
})
export class Community extends AggregateRoot<CommunityPersistenceDto> {
  @NonEmptyString({
    label: 'type',
    description: COMMUNITY_AGGREGATE_TYPE,
  })
  static readonly type = COMMUNITY_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'community ID',
    description: 'a unique system identifier for this community',
    isOptional: true, // not optional after persistence
  })
  id?: string | undefined;

  @NonEmptyString({
    label: 'band number',
    description:
      'a text representation of the unique band number assigned to this community by the government',
  })
  bandNumber: string;

  @NonNegativeInteger({
    label: 'revision number',
    description: `system property that tracks changes to the community information over time`,
  })
  revision: number;

  @NestedDataType(() => MultilingualText, {
    label: 'name',
    description: 'the community name (including translations)',
  })
  name: MultilingualText;

  @NonEmptyString({
    label: 'nation',
    description: 'the larger Indigenous Nation this community belongs to',
  })
  nation: string;

  constructor({
    id,
    revision,
    bandNumber,
    name,
    nation,
  }: {
    id: string;
    revision: number;
    bandNumber: string;
    name: MultilingualText;
    nation: string;
  }) {
    super();

    this.id = id;

    this.revision = revision;

    this.bandNumber = bandNumber;

    this.name = name;

    this.nation = nation;
  }

  translateName({
    text,
    languageCode,
  }: {
    text: string;
    languageCode: string;
  }): Community | TrueImpactError {
    const updatedName = this.name.translateFreely({ text, languageCode });

    if (updatedName instanceof TrueImpactError) {
      return updatedName;
    }

    this.name = updatedName;

    return this;
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getName(): string {
    return this.name.toString();
  }

  toPersistenceDto(): CommunityPersistenceDto {
    return {
      id: this.id as string,
      revision: this.revision,
      name: this.name.toPersistenceDto(),
      nation: this.nation,
      bandNumber: this.bandNumber,
    };
  }

  static fromUserRequest({
    bandNumber,
    name,
    languageCodeForName,
    nation,
  }: CreateCommunity): Community | TrueImpactError {
    if (languageCodeForName !== 'en') {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Providing the community name in a language [${languageCodeForName}] other than English is not yet supported, but you can translate the name into Chilcotin.`,
        ),
      ]);
    }

    const nameBuildResult = MultilingualText.withText({
      text: name,
      languageCode: languageCodeForName,
    });

    if (nameBuildResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to create a new community. Invalid name provided by user.`,
          [nameBuildResult],
        ),
      ]);
    }

    const instance = new Community({
      // id will be generated on persistence
      id: undefined as unknown as string,
      revision: 0, // incremented on persistence
      nation,
      name: nameBuildResult,
      bandNumber,
    });

    return instance.validateInvariants();
  }

  static fromPersistenceDto(
    { id, revision, name, nation, bandNumber }: CommunityPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): Community | TrueImpactError {
    const nameBuildResult = MultilingualText.fromPersistenceDto(
      name,
      buildOptions,
    );

    if (nameBuildResult instanceof TrueImpactError) {
      return nameBuildResult;
    }

    const instance = new Community({
      id,
      revision,
      name: nameBuildResult,
      nation,
      bandNumber,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
