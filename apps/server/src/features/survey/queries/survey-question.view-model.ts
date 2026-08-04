import { FlagViewModelClientDto } from '../../../features/flags/queries';
import { SurveyOption } from '../survey-management/survey-option.entity';
import { SurveyQuestion } from '../survey-management/survey-question.entity';
import {
  FollowUpQuestionViewModel,
  SurveyOptionViewModel,
  SurveyOptionViewModelClientDto,
} from './survey-option.view-model';

export class SurveyQuestionViewModelClientDto {
  label: string;

  prompt: string;

  options: Record<string, SurveyOptionViewModelClientDto>;
}

export class SurveyQuestionViewModel {
  label: string;

  prompt: string;

  options: Map<string, SurveyOptionViewModel>;

  constructor({
    label,
    prompt,
    options,
  }: {
    label: string;

    prompt: string;

    options: Map<string, SurveyOptionViewModel>;
  }) {
    this.label = label;

    this.prompt = prompt;

    /**
     * We might be tempted to clone here. But because we never update a domain model
     * in the same path we project off a domain model for queries, there is no risk of
     * side-effects.
     */
    this.options = options;
  }

  toClientDto(): SurveyQuestionViewModelClientDto {
    const options: Record<string, SurveyOptionViewModelClientDto> = {};

    this.options.forEach((o, optionLabel) => {
      options[optionLabel] = o.toClientDto();
    });

    return {
      label: this.label,
      prompt: this.prompt,
      options,
    };
  }

  // TODO why isn't this used?
  static fromDomainModel(
    surveyQuestion: SurveyQuestion,
    questionsByLabel: Map<string, FollowUpQuestionViewModel>,
    context: {
      flags: Map<string, FlagViewModelClientDto>;
      analyzerValuesByOptionLabel: Map<
        string,
        Map<string, Map<string, number>>
      >;
    },
  ) {
    const options = new Map<string, SurveyOptionViewModel>();

    surveyQuestion.options.forEach((surveyOption: SurveyOption) => {
      const optionViewModel = SurveyOptionViewModel.fromDomainModel(
        surveyOption,
        questionsByLabel,
        context,
      );

      options.set(surveyOption.label, optionViewModel);
    });

    return new SurveyQuestionViewModel({
      label: surveyQuestion.label,
      prompt: surveyQuestion.prompt,
      options,
    });
  }
}
