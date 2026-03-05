import {
  Entity,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';

export class SurveyOptionPersistenceDto {
  flagIds: string[];
  label: string;
  text: string;
  nextQuestionLabel?: string;
  values: Record<string, number>;
}

@TrueImpactDataExample<SurveyOptionPersistenceDto>({
  example: {
    label: 'a',
    text: 'this is rarely true',
    values: {},
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
   * Note that the parent `Survey` has to handle navigating to the next question. This serves as an "adjacency list" entry.
   * We designed in this way to avoid introducing the circular build dependency
   * SurveyQuestion -> SurveyOption -> SurveyQuestion
   *
   * Possible alternatives include
   * class SurveyFollowUpQuestion
   * interface Question // (indepdent of `Option` class)
   */
  @NonEmptyString({
    label: 'label for next question',
    description:
      'a local ID referring to the question that should be presented if the user has chosen this option',
    isArray: false,
    isOptional: false,
  })
  followUpQuestionLabel?: string;

  /**
   * TODO We probably don't want to attach values for categories here. We should introduce a `SurveyAnalyzer`
   * which has a `survey` and assigns values across categories along with values for questions. One survey could have multiple analyzers.
   */
  // @lookup table
  values = new Map<string, number>();

  flagIds = new Set<string>();

  constructor({
    label,
    text,
    nextQuestionLabel,
    values,
    flagIds,
  }: {
    label: string;
    text: string;
    nextQuestionLabel?: string;
    values?: Record<string, number>;
    flagIds: string[];
  }) {
    super();

    this.label = label;

    this.text = text;

    this.followUpQuestionLabel = nextQuestionLabel;

    if (values) {
      this.values = new Map<string, number>(Object.entries(values));
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
      values: Object.fromEntries(this.values),
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

  /**
   * TODO Move this behaviour to a separate `SurveyAnalyzer`.
   */
  getValue(category: string): number {
    /**
     * Note that there may be categories that are important to other questions \ options.
     * They do not need to be registered if they do not apply to this option. We simply
     * contribute 0 to unknown categories.
     */

    if (!this.values.has(category)) {
      return 0;
    }

    return this.values.get(category) || 0;
  }

  /**
   * TODO Move this behaviour to a separate `SurveyAnalyzer`
   * @param values
   * @returns
   */
  @UpdateMethod()
  addValuesForCategories(
    values: Record<string, number>,
  ): SurveyOption | TrueImpactError {
    const conflictingWeigtErrors: TrueImpactError[] = Object.entries(
      values,
    ).reduce((acc: TrueImpactError[], [cateogry, valueForCategory]) => {
      if (this.values.has(cateogry)) {
        acc.push(
          new TrueImpactError(
            `You cannot add value [${valueForCategory}] for category [${cateogry}] to option [${this.label}] as there is already a category named [${cateogry}] with the value [${this.values.get(cateogry)}]`,
          ),
        );
      }
      return acc;
    }, []);

    if (conflictingWeigtErrors.length > 0) {
      // TODO inject Survey and Question context?
      return new TrueImpactError(
        `Failed to add values for categories to option [${this.label}]`,
        conflictingWeigtErrors,
      );
    }

    Object.entries(values).forEach(([category, valueForCategory]) => {
      this.values.set(category, valueForCategory);
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

  static fromPersistenceDto(
    {
      label,
      text,
      nextQuestionLabel,
      values,
      flagIds,
    }: SurveyOptionPersistenceDto,
    shouldValidate = false,
  ): SurveyOption | TrueImpactError {
    const result = new SurveyOption({
      label,
      text,
      nextQuestionLabel,
      values,
      flagIds,
    });

    return shouldValidate ? result.validateInvariants() : result;
  }

  // an "empty" option has no flags or category values
  static buildEmpty({
    optionLabel: label,
    text,
  }: {
    optionLabel: string;
    text: string;
  }): SurveyOption | TrueImpactError {
    return new SurveyOption({ label, text, flagIds: [] });
  }
}
