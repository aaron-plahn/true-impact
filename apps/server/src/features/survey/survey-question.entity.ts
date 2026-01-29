import {
  Entity,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../libs';
import { AddQuestionToSurvey } from './commands/add-question-to-survey.command';
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

  size(): number {
    return this.options.size;
  }

  static fromAddQuestionToSurvey({
    label,
    prompt,
  }: AddQuestionToSurvey): SurveyQuestion | TrueImpactError {
    const instance = new SurveyQuestion({ label, prompt });

    return instance.validateInvariants();
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
