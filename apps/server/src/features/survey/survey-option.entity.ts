import {
  Entity,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs';

export class SurveyOptionPersistenceDto {
  flagIds: string[];
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
    flagIds: [],
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
  followUpQuestionLabel?: string;

  // @lookup table
  weights = new Map<string, number>();

  flagIds = new Set<string>();

  constructor({
    label,
    text,
    nextQuestionLabel,
    weights,
    flagIds,
  }: {
    label: string;
    text: string;
    nextQuestionLabel?: string;
    weights?: Record<string, number>;
    flagIds: string[];
  }) {
    super();

    this.label = label;

    this.text = text;

    this.followUpQuestionLabel = nextQuestionLabel;

    if (weights) {
      this.weights = new Map<string, number>(Object.entries(weights));
    }

    if (Array.isArray(flagIds)) {
      for (const flagId of flagIds) {
        this.flagIds.add(flagId);
      }
    }
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.label;
  }

  getName(): string {
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
      nextQuestionLabel: this.followUpQuestionLabel,
      weights: Object.fromEntries(this.weights),
      flagIds: Array.from(this.flagIds),
    };

    return result;
  }

  hasFlag(flagId: string): boolean {
    return this.flagIds.has(flagId);
  }

  getFlagIds(): string[] {
    return Array.from(this.flagIds);
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

  // TODO We may want to allow a top-level flat ordered list of follow-up questions
  // Note that it is the responsibility of the `Survey` to validate the follow-up question's existence before passing the request up the line
  @UpdateMethod()
  addFollowUpQuestion(label: string): this | TrueImpactError {
    if (this.followUpQuestionLabel) {
      return new TrueImpactError(
        `You cannot add follow-up question [${label}] to option [${this.label}] as adding a second follow-up question is not currently supported.\nCurrent follow-up question [${this.followUpQuestionLabel}]`,
      );
    }

    this.followUpQuestionLabel = label;

    return this;
  }

  @UpdateMethod()
  addFlag(flagId: string) {
    if (this.flagIds.has(flagId)) {
      return new TrueImpactError(
        // TODO Can we inject the flag at some point?
        `You cannot add flag [${flagId}] to option [${this.label}] as it already has this flag.`,
      );
    }

    this.flagIds.add(flagId);

    return this;
  }

  static fromPersistenceDto({
    label,
    text,
    nextQuestionLabel,
    weights,
    flagIds,
  }: SurveyOptionPersistenceDto): SurveyOption {
    const result = new SurveyOption({
      label,
      text,
      nextQuestionLabel,
      weights,
      flagIds,
    });

    return result;
  }

  static fromAddOptionToSurveyQuestion({
    optionLabel: label,
    text,
  }: {
    optionLabel: string;
    text: string;
  }): SurveyOption | TrueImpactError {
    return new SurveyOption({ label, text, flagIds: [] });
  }
}
