import {
  MultilingualText,
  MultilingualTextItem,
  MultilingualTextItemRole,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import { DomainEvent, EventPayload } from '../../../libs/cqrs-es';
import {
  EventSourcedAggregateRoot,
  Literal,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { CommunityCreated } from '../commands/create-community/community-created.event';
import { CreateCommunity } from '../commands/create-community/create-community.command';
import { CommunityNameTranslated } from '../commands/translate-community-name/community-name-translated.event';
import { COMMUNITY_AGGREGATE_TYPE } from '../constants';

export class CommunityPersistenceDto {
  id: string;

  bandNumber: string;

  revision: number;

  name: MultilingualTextPersistenceDto;
}

// TODO - can we register a sample community with an event history instead?
@TrueImpactDataExample<CommunityPersistenceDto>({
  example: {
    id: '123',
    bandNumber: '711',
    revision: 2,
    // nation: 'River People',
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
export class Community extends EventSourcedAggregateRoot {
  @Literal(COMMUNITY_AGGREGATE_TYPE, {
    label: 'type',
    description: 'distinguishes clients from other entities in our system',
  })
  type = COMMUNITY_AGGREGATE_TYPE;

  @RawObject({
    label: 'event history',
    description: 'audit log of all changes ever made to this community',
  })
  eventHistory: DomainEvent<EventPayload>[] = [];

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

  // @NonEmptyString({
  //   label: 'nation',
  //   description: 'the larger Indigenous Nation this community belongs to',
  // })
  // nation: string;

  constructor({
    id,
    revision,
    bandNumber,
    name,
    // nation,
  }: {
    id: string;
    revision: number;
    bandNumber: string;
    name: MultilingualText;
    // nation: string;
  }) {
    super();

    this.id = id;

    this.revision = revision;

    this.bandNumber = bandNumber;

    this.name = name;
  }

  @UpdateMethod()
  translateName({
    text,
    languageCode,
  }: {
    text: string;
    languageCode: string;
  }): Community | TrueImpactError {
    const updatedName = this.name.canTranslateFreelyAs({ text, languageCode });

    if (updatedName instanceof TrueImpactError) {
      return updatedName;
    }

    return this.apply(
      new CommunityNameTranslated({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          translation: {
            text,
            languageCode,
            translationType: 'original',
          },
        },
      }),
    );
  }

  handleCommunityNameTranslated({
    payload: {
      translation: { text, languageCode },
    },
  }: CommunityNameTranslated) {
    const translationsByLanguage =
      this.name.items.get(languageCode) ||
      new Map<MultilingualTextItemRole, MultilingualTextItem>();

    translationsByLanguage.set(
      MultilingualTextItemRole.freeTranslation,
      new MultilingualTextItem({ text }),
    );

    this.name.items.set(languageCode, translationsByLanguage);

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
      bandNumber: this.bandNumber,
    };
  }

  static fromCommunityCreated(
    event: CommunityCreated,
  ): Community | TrueImpactError {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
        name,
        bandNumber,
      },
    } = event;

    const nameBuildResult = MultilingualText.withText(name);

    if (nameBuildResult instanceof TrueImpactError) {
      return nameBuildResult;
    }

    const instance = new Community({
      id,
      revision: 1,
      bandNumber,
      name: nameBuildResult,
    });

    instance.eventHistory.push(event);

    const validationResult = instance.validateInvariants();

    return validationResult;
  }

  static fromEventHistory(
    eventHistory: Iterable<DomainEvent>,
  ): EventSourcedAggregateRoot | TrueImpactError | null {
    return EventSourcedAggregateRoot.fromEventHistory.call(
      Community,
      eventHistory,
    ) as Community;
  }

  static fromUserRequest({
    bandNumber,
    name,
    languageCodeForName,
    // nation,
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
      // nation,
      name: nameBuildResult,
      bandNumber,
    });

    instance.eventHistory.push(
      new CommunityCreated({
        payload: {
          aggregateCompositeIdentifier: instance.getCompositeIdentifier(),
          name: {
            text: name,
            languageCode: languageCodeForName,
            translationType: 'original',
          },
          bandNumber,
        },
      }),
    );

    return instance.validateInvariants();
  }

  static fromPersistenceDto(
    {
      id,
      revision,
      name,
      // nation,
      bandNumber,
    }: CommunityPersistenceDto,
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
      // nation,
      bandNumber,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
