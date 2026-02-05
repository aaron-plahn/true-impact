import {
  Entity,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs';
import {
  SurveyOption,
  SurveyOptionPersistenceDto,
} from './survey-option.entity';

type SurveyLabel = string;

export class SurveyQuestionPersistenceDto {
  label: string;
  prompt: string;
  options: Record<SurveyLabel, SurveyOptionPersistenceDto>;
}

@TrueImpactDataExample<SurveyQuestionPersistenceDto>({
  example: {
    label: 'test survey question',
    prompt: 'How often do you play sports?',
    options: {},
  },
})
export class SurveyQuestion extends Entity {
  // e.g. 1, 2, 3
  label: string;

  @NonEmptyString({
    label: 'prompt',
    description: 'user facing text for this question',
    isArray: false,
    isOptional: false,
  })
  prompt: string;

  // @LookupTable(SurveyOption,{...})
  options: Map<SurveyLabel, SurveyOption>;

  constructor({
    label,
    prompt,
    options,
  }: {
    label: string;
    prompt: string;
    options?: Record<SurveyLabel, SurveyOption>;
  }) {
    super();

    this.label = label;

    this.prompt = prompt;

    this.options = new Map(Object.entries(options || {}));
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.label;
  }

  // TODO organize all class methods
  getName(): string {
    return this.label;
  }

  size(): number {
    return this.options.size;
  }

  @UpdateMethod()
  addOption(userRequest: {
    optionLabel: string;
    questionLabel: string;
    text: string;
  }): SurveyQuestion | TrueImpactError {
    if (this.options.has(userRequest.optionLabel)) {
      return new TrueImpactError(
        `You cannot add option [${userRequest.optionLabel}] to question [${userRequest.questionLabel}] as there is already an option with this label.`,
      );
    }

    const { optionLabel: label } = userRequest;

    const questionsWithTheSameText = Array.from(this.options.values()).filter(
      // TODO trim and remove punctuation?
      // TODO add case-insensitive test cases
      ({ text }) => {
        return text.toLowerCase() === userRequest.text.toLowerCase();
      },
    );

    if (questionsWithTheSameText.length > 0) {
      return new TrueImpactError(
        `You cannot add option [${userRequest.optionLabel}] to question [${userRequest.questionLabel}] as question [${questionsWithTheSameText[0].label}] already has the text [${questionsWithTheSameText[0].text}]`,
      );
    }
    // TODO allow the user to register a "next" for a question

    const optionBuildResult = SurveyOption.buildEmpty(userRequest);

    if (optionBuildResult instanceof TrueImpactError) {
      return optionBuildResult;
    }

    this.options.set(label, optionBuildResult);

    return this;
  }

  @UpdateMethod()
  addWeightsForOption({
    optionLabel,
    weights,
  }: {
    optionLabel: string;
    weights: Record<string, number>;
  }): this | TrueImpactError {
    const targetOption =
      this.get(optionLabel) ||
      new TrueImpactError(
        `You cannot add weights for option [${optionLabel}] in question [${this.label}] as there is no such option`,
      );

    if (targetOption instanceof TrueImpactError) {
      return targetOption;
    }

    const updatedOption = targetOption.addValuesForCategories(weights);

    if (updatedOption instanceof TrueImpactError) {
      return updatedOption;
    }

    this.options.set(optionLabel, updatedOption);

    return this;
  }

  addFollowUpQuestionForOption({
    optionLabel,
    followUpQuestionLabel,
  }: {
    optionLabel: string;
    followUpQuestionLabel: string;
  }): this | TrueImpactError {
    const updatedOption =
      this.get(optionLabel)?.addFollowUpQuestion(followUpQuestionLabel) ||
      new TrueImpactError(
        `You cannot add a follow-up question to option [${optionLabel}] as there is no such option in question [${this.label}]`,
      );

    if (updatedOption instanceof TrueImpactError) {
      return updatedOption;
    }

    this.options.set(optionLabel, updatedOption);

    return this;
  }

  get(optionLabel: string): SurveyOption | null {
    return this.options.get(optionLabel) || null;
  }

  toPersistenceDto(): SurveyQuestionPersistenceDto {
    const result: SurveyQuestionPersistenceDto = {
      label: this.label,
      prompt: this.prompt,
      options: Array.from(this.options.entries()).reduce(
        (
          acc: Record<string, SurveyOptionPersistenceDto>,
          [optionLabel, option]: [string, SurveyOption],
        ) => {
          acc[optionLabel] = option.toPersistenceDto();

          return acc;
        },
        {} as Record<string, SurveyOptionPersistenceDto>,
      ),
    };

    return result;
  }

  // An "empty" question has no options
  static buildEmpty({
    label,
    prompt,
  }: {
    label: string;
    prompt: string;
  }): SurveyQuestion | TrueImpactError {
    const instance = new SurveyQuestion({ label, prompt });

    return instance.validateInvariants();
  }

  static fromPersistenceDto({
    label,
    options,
    prompt,
  }: SurveyQuestionPersistenceDto): SurveyQuestion {
    const optionsBuildResult = Object.entries(options).reduce(
      (acc: Record<string, SurveyOption>, [label, option]) => {
        const optionBuildResult = SurveyOption.fromPersistenceDto(option);

        acc[label] = optionBuildResult;

        return acc;
      },
      {},
    );

    return new SurveyQuestion({
      label,
      prompt,
      options: optionsBuildResult,
    });
  }
}
