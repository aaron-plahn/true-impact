import { SurveyOption } from '../survey-management/survey-option.entity';
import { SurveyQuestion } from '../survey-management/survey-question.entity';
import { SurveyOptionViewModel } from './survey-option.view-model';

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

  static fromDomainModel(
    surveyQuestion: SurveyQuestion,
    questionsByLabel: Map<
      string,
      {
        label: string;

        prompt: string;

        options: Map<string, SurveyOptionViewModel>;
      }
    >,
  ) {
    const options = new Map<string, SurveyOptionViewModel>();

    surveyQuestion.options.forEach((surveyOption: SurveyOption) => {
      const optionViewModel = SurveyOptionViewModel.fromDomainModel(
        surveyOption,
        questionsByLabel,
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
