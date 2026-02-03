import {
  Entity,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs';
import { AddOptionToSurveyQuestion } from './commands/add-option-to-survey-question.command';

export class SurveyOptionPersistenceDto {
  label: string;
  text: string;
  nextQuestionLabel?: string;
  weights: Record<string, number>;
}

@TrueImpactDataExample<SurveyOptionPersistenceDto>({
  example: {
    label: 'a',
    text: 'this is rarely true',
    weights: {},
    // nextQuestionLabel:
  },
})
export class SurveyOption extends Entity {
  @NonEmptyString({
    label: 'label',
    description: 'the label for this survey option (e.g., b, ii, 2)',
    isArray: false,
    isOptional: false,
  })
  label: string;

  @NonEmptyString({
    label: 'text',
    description: 'text to display to the user for this option',
    isArray: false,
    isOptional: false,
  })
  text: string; // TODO make this translateable

  /**
   * Note that we have to backtrack within the Survey graph to find the corresponding question in order to avoid circular dependencies.
   */
  @NonEmptyString({
    label: 'label for next question',
    description:
      'a local ID referring to the question that should be presented if the user has chosen this option',
    isArray: false,
    isOptional: false,
  })
  nextQuestionLabel?: string;

  // @lookup table
  weights = new Map<string, number>();

  constructor({
    label,
    text,
    nextQuestionLabel,
    weights,
  }: {
    label: string;
    text: string;
    nextQuestionLabel?: string;
    weights?: Record<string, number>;
  }) {
    super();

    this.label = label;

    this.text = text;

    this.nextQuestionLabel = nextQuestionLabel;

    if (weights) {
      this.weights = new Map<string, number>(Object.entries(weights));
    }
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.label;
  }

  /**
   * Eventually, we will support creating a draft of edits to a live survey. Once the draft
   * is published, the survey revision number (version) will be incremented. This will allow us
   * to keep track of which version of a suvey a client completed over time.
   */
  getRevisionNumber(): number {
    return 1;
  }

  toPersistenceDto(): SurveyOptionPersistenceDto {
    const result: SurveyOptionPersistenceDto = {
      label: this.label,
      text: this.text,
      nextQuestionLabel: this.nextQuestionLabel,
      weights: Object.fromEntries(this.weights),
    };

    return result;
  }

  getWeight(weightName: string): number {
    /**
     * Note that there may be weights that are important to other questions \ options.
     * They do not need to be registered if they do not apply to this option. We simply
     * contribute 0 to unknown weights.
     */

    if (!this.weights.has(weightName)) {
      return 0;
    }

    return this.weights.get(weightName) || 0;
  }

  @UpdateMethod()
  addWeights(weights: Record<string, number>): SurveyOption | TrueImpactError {
    const conflictingWeigtErrors: TrueImpactError[] = Object.entries(
      weights,
    ).reduce((acc: TrueImpactError[], [weightName, weightValue]) => {
      if (this.weights.has(weightName)) {
        acc.push(
          new TrueImpactError(
            `You cannot add value [${weightValue}] for weight [${weightName}] to option [${this.label}] as there is already a weight named [${weightName}] with the value [${this.weights.get(weightName)}]`,
          ),
        );
      }
      return acc;
    }, []);

    if (conflictingWeigtErrors.length > 0) {
      // TODO inject Survey and Question context?
      return new TrueImpactError(
        `Failed to add weights to option [${this.label}]`,
        conflictingWeigtErrors,
      );
    }

    Object.entries(weights).forEach(([weightName, weightValue]) => {
      this.weights.set(weightName, weightValue);
    });

    return this;
  }

  static fromPersistenceDto({
    label,
    text,
    nextQuestionLabel,
    weights,
  }: SurveyOptionPersistenceDto): SurveyOption {
    const result = new SurveyOption({
      label,
      text,
      nextQuestionLabel,
      weights,
    });

    return result;
  }

  static fromAddOptionToSurveyQuestion({
    optionLabel: label,
    text,
  }: AddOptionToSurveyQuestion): SurveyOption | TrueImpactError {
    return new SurveyOption({ label, text });
  }
}
