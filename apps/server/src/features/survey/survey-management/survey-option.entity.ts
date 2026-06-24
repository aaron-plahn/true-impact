import {
  Entity,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { SetDataType } from '../../../libs/data-types/schema-management/decorators/set-data-type.decorator';

export class SurveyOptionPersistenceDto {
  flagIds: string[];
  label: string;
  text: string;
  nextQuestionLabel?: string;
}

@TrueImpactDataExample<SurveyOptionPersistenceDto>({
  example: {
    label: 'a',
    text: 'this is rarely true',
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
    isOptional: true,
  })
  followUpQuestionLabel?: string;

  // @NonEmptyString({
  //   label: 'flags',
  //   description:
  //     'the flags that a participant raises by responding to the target question by choosing this option',
  //   isArray: true,
  //   isOptional: true, // i.e. can be empty
  // })

  @SetDataType('string', {
    label: 'flags',
    description:
      'a set of flags that should be raised for a user who answers the parent question by choosing this option',
  })
  flagIds = new Set<string>();

  constructor({
    label,
    text,
    nextQuestionLabel,
    flagIds,
  }: {
    label: string;
    text: string;
    nextQuestionLabel?: string;
    flagIds: string[];
  }) {
    super();

    this.label = label;

    this.text = text;

    this.followUpQuestionLabel = nextQuestionLabel;

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
    { label, text, nextQuestionLabel, flagIds }: SurveyOptionPersistenceDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): SurveyOption | TrueImpactError {
    const result = new SurveyOption({
      label,
      text,
      nextQuestionLabel,
      flagIds,
    });

    return buildOptions?.shouldValidate ? result.validateInvariants() : result;
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
