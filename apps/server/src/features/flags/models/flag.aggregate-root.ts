import { randomUUID } from 'crypto';
import { DomainEvent, EventPayload } from 'src/libs/cqrs-es';
import {
  EventSourcedAggregateRoot,
  Literal,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { FlagCreated, FlagRelabelled } from '../commands';
import { FLAG_AGGREGATE_TYPE } from '../constants';

const DEFAULT_LANGUAGE_CODE_FOR_FLAGS = 'en';

export class FlagPersistenceDto {
  id: string;
  revision: number;
  label: string;
  description: string;
}

@TrueImpactDataExample<FlagPersistenceDto>({
  example: {
    id: '123',
    label: 'dangerous animal on site',
    revision: 1,
    description: `Beware of a dangerous animal (e.g., a dog that bites) at the client's primary residence.`,
  },
})
export class Flag extends EventSourcedAggregateRoot {
  @Literal(FLAG_AGGREGATE_TYPE, {
    label: 'type',
    description: 'distinguishes flags from other entities within our system',
  })
  readonly type = FLAG_AGGREGATE_TYPE;

  @RawObject({
    label: 'event history',
    description: 'audit log containing all historical edits of this survey',
    isArray: true,
    // TODO rename this `canBeEmpty` for Array valued props?
    isOptional: true, // i.e. can be empty
  })
  eventHistory: DomainEvent<EventPayload>[] = [];

  @NonEmptyString({
    label: 'type',
    description: FLAG_AGGREGATE_TYPE,
  })
  static readonly type = FLAG_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'id',
    description: 'id',
    // this is not optional once the first instance has been persisted
    isOptional: true,
  })
  id?: string | undefined;

  @NonNegativeInteger({
    label: 'revision number',
    description: `uniquely identifies the current version of this flag amongst its historical versions`,
  })
  revision: number;

  @NonEmptyString({
    label: 'label',
    description: 'short-text to display to users',
    mustBeUnique: true,
  })
  label: string; // TODO Multilingual Text

  @NonEmptyString({
    label: 'description',
    description: 'a longer description of the significance of this flag',
  })
  description: string; // TODO Multilingual Text

  constructor({
    id,
    revision,
    label,
    description,
  }: {
    id?: string;
    revision: number;
    label: string;
    description: string;
  }) {
    super();

    if (id) {
      this.id = id;
    }

    this.revision = revision;

    this.label = label;

    this.description = description;
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getName(): string {
    return this.label;
  }

  toPersistenceDto(): FlagPersistenceDto {
    return {
      id: this.id as string,
      revision: this.revision,
      label: this.label,
      description: this.description,
    };
  }

  @UpdateMethod()
  relabel({ newLabel }: { newLabel: string }): Flag | TrueImpactError {
    if (this.label === newLabel) {
      return new TrueImpactError(
        `You cannot relabel flag [${this.id}], as it already has the label [${newLabel}].`,
      );
    }

    const e = new FlagRelabelled({
      payload: {
        aggregateCompositeIdentifier: this.getCompositeIdentifier(),
        newLabel,
      },
    });

    return this.apply(e);
  }

  handleFlagRelabelled({ payload: { newLabel } }: FlagRelabelled) {
    this.label = newLabel;

    return this;
  }

  static fromEventHistory(
    eventHistory: Iterable<DomainEvent>,
  ): EventSourcedAggregateRoot | TrueImpactError | null {
    return EventSourcedAggregateRoot.fromEventHistory.call(
      Flag,
      eventHistory,
    ) as Flag;
  }

  static fromFlagCreated(event: FlagCreated) {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
        label,
        description: { text: description },
      },
    } = event;

    const instance = new Flag({
      id,
      revision: 1,
      label,
      description,
    });

    instance.eventHistory.push(event);

    return instance.validateInvariants();
  }

  static fromClientRequest({
    label,
    description,
  }: {
    label: string;
    description: string;
  }): Flag | TrueImpactError {
    const instance = new Flag({
      id: randomUUID(),
      revision: 0,
      label,
      description,
    });

    instance.eventHistory.push(
      new FlagCreated({
        payload: {
          aggregateCompositeIdentifier: instance.getCompositeIdentifier(),
          label,
          description: {
            text: description,
            languageCode: DEFAULT_LANGUAGE_CODE_FOR_FLAGS,
            translationType: 'original',
          },
        },
      }),
    );

    return instance.validateInvariants();
  }

  static fromPersistenceDto(
    { id, revision, label, description }: FlagPersistenceDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): Flag | TrueImpactError {
    const instance = new Flag({ id, revision, label, description });

    return buildOptions.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
