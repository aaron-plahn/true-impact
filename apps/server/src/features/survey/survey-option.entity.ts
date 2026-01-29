import { Entity, NonEmptyString, TrueImpactError } from '../../libs';

export class SurveyOptionPersistenceDto {
  label: string;
  text: string;
  nextQuestionLabel?: string;
}

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

  constructor({
    label,
    text,
    nextQuestionLabel,
  }: {
    label: string;
    text: string;
    nextQuestionLabel?: string;
  }) {
    super();

    this.label = label;

    this.text = text;

    this.nextQuestionLabel = nextQuestionLabel;
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
    };

    return result;
  }

  static fromPersistenceDto({
    label,
    text,
    nextQuestionLabel,
  }: SurveyOptionPersistenceDto): SurveyOption {
    return new SurveyOption({ label, text, nextQuestionLabel });
  }
}
