import {
  deepConvertMapToObject,
  DeepMapToRecord,
  Entity,
  TrueImpactError,
} from '../../../../libs/data-types';

type QuestionLabel = string;
type OptionLabel = string;
type CategoryLabel = string;

type ValuesByQuestion = Map<
  QuestionLabel,
  Map<OptionLabel, Map<CategoryLabel, number>>
>;

type RawValuesByQuestion = DeepMapToRecord<ValuesByQuestion>;

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
  valuesByQuestion: RawValuesByQuestion;
}

export class SurveyOptionValueTracker extends Entity {
  // This is awkward to constrain using decorator based validation
  valuesByQuestion: ValuesByQuestion = new Map();

  constructor({ valuesByQuestion }: { valuesByQuestion: RawValuesByQuestion }) {
    super();

    Object.entries(valuesByQuestion).forEach(
      ([questionLabel, valuesByOption]) => {
        this.valuesByQuestion.set(
          questionLabel,
          new Map<string, Map<string, number>>(),
        );

        Object.entries(valuesByOption).forEach(
          ([optionLabel, valuesByCategoryForThisOption]) => {
            this.valuesByQuestion
              .get(questionLabel)
              ?.set(optionLabel, new Map<string, number>());

            Object.entries(valuesByCategoryForThisOption).forEach(
              ([categoryLabel, value]) => {
                this.valuesByQuestion
                  .get(questionLabel)
                  ?.get(optionLabel)
                  ?.set(categoryLabel, value);
              },
            );
          },
        );
      },
    );
  }

  // TODO move validation logic here?
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
    const values = deepConvertMapToObject(this.valuesByQuestion);

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
