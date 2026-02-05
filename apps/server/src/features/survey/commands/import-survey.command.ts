import { NonEmptyString } from '../../../libs';

export class SurveyImportQuestionOptionDto {
  @NonEmptyString({
    label: 'label',
    description: 'label for this question',
    isArray: false,
    isOptional: false,
  })
  label: string;

  @NonEmptyString({
    label: 'text',
    description: 'text for this option',
    isArray: false,
    isOptional: false,
  })
  text: string;

  @NonEmptyString({
    label: 'label of next question',
    description:
      'label of the question the user should be shown next if this option is chosen',
    isArray: false,
    isOptional: true,
  })
  nextQuestionLabel?: string;
}

export class SurveyImportQuestionDto {
  @NonEmptyString({
    label: 'label',
    description: 'the label for this question in the survey',
    isArray: false,
    isOptional: false,
  })
  label: string;

  @NonEmptyString({
    label: 'prompt',
    description: 'the user-facing text for this question',
    isArray: false,
    isOptional: false,
  })
  prompt: string;

  // @NestedDataType(SurveyImportQuestionOptionDto,{ isArray: true, ...})
  options: SurveyImportQuestionOptionDto[];
}

export class ImportSurvey {
  // TODO @Unique
  @NonEmptyString({
    label: 'name',
    description: 'the name distinguishes this from other surveys in lists',
    isArray: false,
    isOptional: false,
  })
  name: string;

  // @NestedDataType(SurveyImportQuestionDto,{ isArray: true, ...})
  questions: SurveyImportQuestionDto[];
}
