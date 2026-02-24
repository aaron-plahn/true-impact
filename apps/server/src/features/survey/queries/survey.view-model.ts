import { NonEmptyString } from 'src/libs/data-types';
import { SurveyOption } from '../survey-option.entity';
import { SurveyQuestion } from '../survey-question.entity';
import { Survey } from '../survey.aggregate-root';
import { SurveyOptionViewModel } from './survey-option.view-model';
import { SurveyQuestionViewModel } from './survey-question.view-model';

/**
 * We have an intentional mapping layer between the view model and the client. This allows us to
 * work with more convenient structures (e.g. Maps instead of Records) and remove \ transform data
 * before sending a client response.
 */
export class SurveyViewModelClientDto {
  id: string;

  isPublished: boolean;

  name: string;

  size: number;

  questions: {
    label: string;

    prompt: string;

    options: Record<string, SurveyOptionViewModel>;
  }[];
}

export class SurveyViewModel {
  @NonEmptyString({
    label: 'ID',
    description: 'System identifier for this survey',
  })
  id: string;

  @NonEmptyString({
    label: 'name',
    description: 'Name of this survey',
  })
  name: string;

  @NonEmptyString({
    label: 'revision',
    description: 'unique ID for the current revision of this survey',
  })
  revision: string;

  @NonEmptyString({
    label: 'size',
    description: 'The total number of questions in this survey',
  })
  size: number;

  // @NestedViewModel
  questions: SurveyQuestionViewModel[];

  isPublished: boolean;

  constructor({
    id,
    name,
    size,
    questions,
    isPublished,
  }: {
    id: string;
    name: string;
    size: number;
    questions?: SurveyQuestionViewModel[];
    isPublished: boolean;
  }) {
    this.id = id;

    this.name = name;

    this.size = size;

    this.questions = questions || [];

    this.isPublished = typeof isPublished === 'boolean' ? isPublished : false;
  }

  toClientDto(): SurveyViewModelClientDto {
    return {
      id: this.id,
      isPublished: this.isPublished,
      name: this.name,
      size: this.size,
      questions: this.questions.map((q) => ({
        label: q.label,
        prompt: q.prompt,
        options: Object.fromEntries(q.options.entries()),
      })),
    };
  }

  static buildSurveyQuestionViewModel(
    surveyQuestion: SurveyQuestion,
    questionBank: Map<string, SurveyQuestion>,
  ): SurveyQuestionViewModel {
    const { label, prompt, options } = surveyQuestion;

    const surveyOptionsAsArray: SurveyOption[] = Array.from(options.values());

    const optionViews: Map<string, SurveyOptionViewModel> =
      surveyOptionsAsArray.reduce(
        (
          acc: Map<string, SurveyOptionViewModel>,
          { label, text, followUpQuestionLabel }: SurveyOption,
        ): Map<string, SurveyOptionViewModel> => {
          const followUpQuestions: SurveyQuestionViewModel[] =
            typeof followUpQuestionLabel === 'string'
              ? [
                  SurveyViewModel.buildSurveyQuestionViewModel(
                    questionBank.get(followUpQuestionLabel) as SurveyQuestion,
                    questionBank,
                  ),
                ]
              : ([] as SurveyQuestionViewModel[]);

          acc.set(label, {
            label,
            text,
            followUpQuestions,
          });

          return acc;
        },
        new Map<string, SurveyOptionViewModel>(),
      );

    return {
      label,
      prompt,
      options: optionViews,
    };
  }

  /**
   * Currently, we project off the domain to build views. This is inefficient.
   * Eventually, we will want to build materialized views from an event history.
   */
  static fromDomainModel(survey: Survey) {
    const questionViewsByLabel: Map<string, SurveyQuestionViewModel> =
      new Map();

    survey.topLevelQuestionLabels.forEach((ql) => {
      const surveyQuestion = survey.questionBank.get(ql) as SurveyQuestion;

      const questionView: SurveyQuestionViewModel =
        SurveyViewModel.buildSurveyQuestionViewModel(
          surveyQuestion,
          survey.questionBank,
        );

      questionViewsByLabel.set(ql, questionView);
    });

    const result = new SurveyViewModel({
      id: survey.getId(),
      name: survey.getName(),
      size: survey.size(),
      questions: Array.from(questionViewsByLabel.values()),
      isPublished: survey.isPublished,
    });

    return result;
  }
}
