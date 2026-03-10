import {
  AggregateRoot,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { FLAG_AGGREGATE_TYPE } from '../constants';

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
export class Flag extends AggregateRoot<FlagPersistenceDto> {
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

    this.label = newLabel;

    return this;
  }

  static fromClientRequest({
    label,
    description,
  }: {
    label: string;
    description: string;
  }): Flag | TrueImpactError {
    const instance = new Flag({
      revision: 0,
      label,
      description,
    });

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
