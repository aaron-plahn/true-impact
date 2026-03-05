import { Entity, TrueImpactError } from '../../../../libs/data-types';

/**
 * All we really need is a lookup table
 * questionLabel -> LookupTable {
 *     optionLabel -> Record<CategoryId,number>
 * }
 *
 * note that we may want to support values other than `number` in the future
 *
 * ## Invariants
 * - Each category must be part of the parent analyzer.
 * - Each value must be a positive integer. -> this may change
 */
export class SurveyOptionValueTrackerPersistenceDto {
  valuesByQuestion: Record<string, Record<string, number>>;
}

export class SurveyOptionValueTracker extends Entity {
  // This is awkward to constrain using decorator based validation
  valuesByQuestion: Map<string, Map<string, number>> = new Map();

  constructor({
    valuesByQuestion,
  }: {
    valuesByQuestion: Record<string, Record<string, number>>;
  }) {
    super();

    Object.entries(valuesByQuestion).forEach(
      ([questionLabel, valuesByOption]) => {
        this.valuesByQuestion.set(
          questionLabel,
          new Map(Object.entries(valuesByOption)),
        );
      },
    );
  }

  validateComplexInvariants(): TrueImpactError[] {
    // TODO add unit test for this or else test it via the `Survey.invalidateInvariants` test
    throw new Error('Method not implemented.');
  }

  // Should this really be an entity?
  getId(): string {
    throw new Error('Method not implemented.');
  }

  getName(): string {
    throw new Error('Method not implemented.');
  }

  toPersistenceDto(): SurveyOptionValueTrackerPersistenceDto {
    const values = Array.from(this.valuesByQuestion.keys()).reduce(
      (acc: Record<string, Record<string, number>>, questionLabel: string) => {
        acc[questionLabel] = Object.fromEntries(
          this.valuesByQuestion.get(questionLabel)?.entries() || [],
        );

        return acc;
      },
      {} as Record<string, Record<string, number>>,
    );

    return {
      valuesByQuestion: values,
    };
  }

  static fromPersistenceDto(
    { valuesByQuestion }: SurveyOptionValueTrackerPersistenceDto,
    _shouldValidate?: boolean,
  ): SurveyOptionValueTracker | TrueImpactError {
    return new SurveyOptionValueTracker({
      valuesByQuestion,
    });
  }
}
