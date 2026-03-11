import { FlagViewModelClientDto } from 'src/features/flags/queries';
import { NestedDataType, NonEmptyString } from '../../../libs/data-types';
import { SurveyOption } from '../survey-management/survey-option.entity';
import { SurveyQuestion } from '../survey-management/survey-question.entity';
import { Survey } from '../survey-management/survey.aggregate-root';
import {
  SurveyAnalyzerViewModel,
  SurveyAnalyzerViewModelClientDto,
} from './survey-analyzer.view-model';
import { SurveyFlagViewModel } from './survey-flag.view-model';
import {
  FollowUpQuestionViewModel,
  SurveyOptionViewModel,
  SurveyOptionViewModelClientDto,
} from './survey-option.view-model';
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

  analyzersByName: Record<string, SurveyAnalyzerViewModelClientDto> = {};

  questions: {
    label: string;

    prompt: string;

    options: Record<string, SurveyOptionViewModelClientDto>;
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

  @NestedDataType(() => SurveyQuestionViewModel, {
    label: 'questions',
    description: 'an ordered list of the top-level questions in this survey',
    isArray: true,
  })
  questions: SurveyQuestionViewModel[];

  analyzersByName: Map<string, SurveyAnalyzerViewModel>;

  isPublished: boolean;

  constructor({
    id,
    name,
    size,
    analyzersByName,
    questions,
    isPublished,
  }: {
    id: string;
    name: string;
    size: number;
    questions?: SurveyQuestionViewModel[];
    analyzersByName: Map<string, SurveyAnalyzerViewModel>;
    isPublished: boolean;
  }) {
    this.id = id;

    this.name = name;

    this.size = size;

    this.questions = questions || [];

    this.isPublished = typeof isPublished === 'boolean' ? isPublished : false;

    this.analyzersByName = analyzersByName;
  }

  toClientDto(): SurveyViewModelClientDto {
    const analyzersByName = {};

    this.analyzersByName.forEach((viewModel) => {
      analyzersByName[viewModel.name] = viewModel.toClientDto();
    });

    return {
      id: this.id,
      isPublished: this.isPublished,
      name: this.name,
      size: this.size,
      analyzersByName,
      questions: this.questions.map((q) => {
        const options: Record<string, SurveyOptionViewModelClientDto> = {};

        q.options.forEach((o, optionLabel) => {
          options[optionLabel] = o.toClientDto();
        });

        return {
          label: q.label,
          prompt: q.prompt,
          options,
        };
      }),
    };
  }

  static buildSurveyQuestionViewModel(
    surveyQuestion: SurveyQuestion,
    questionBank: Map<string, SurveyQuestion>,
    context: { flags: Map<string, FlagViewModelClientDto> },
  ): SurveyQuestionViewModel {
    const { label, prompt, options } = surveyQuestion;

    const surveyOptionsAsArray: SurveyOption[] = Array.from(options.values());

    const optionViews: Map<string, SurveyOptionViewModel> =
      surveyOptionsAsArray.reduce(
        (
          acc: Map<string, SurveyOptionViewModel>,
          { label, text, followUpQuestionLabel }: SurveyOption,
        ): Map<string, SurveyOptionViewModel> => {
          const followUpQuestions: FollowUpQuestionViewModel[] =
            typeof followUpQuestionLabel === 'string'
              ? [
                  SurveyViewModel.buildSurveyQuestionViewModel(
                    questionBank.get(followUpQuestionLabel) as SurveyQuestion,
                    questionBank,
                    context,
                  ) as FollowUpQuestionViewModel, // We do this to avoid circularities with our type definitions when recursing
                ]
              : ([] as FollowUpQuestionViewModel[]);

          const flags = new Map<string, SurveyFlagViewModel>();

          context.flags.forEach(({ id, label, description }, flagId) => {
            flags.set(
              flagId,
              new SurveyFlagViewModel({ id, label, description }),
            );
          });

          const optionView = new SurveyOptionViewModel({
            label,
            text,
            followUpQuestions,
            flags,
          });

          acc.set(label, optionView);

          return acc;
        },
        new Map<string, SurveyOptionViewModel>(),
      );

    return new SurveyQuestionViewModel({
      label,
      prompt,
      options: optionViews,
    });
  }

  /**
   * Currently, we project off the domain to build views. This is inefficient.
   * Eventually, we will want to build materialized views from an event history.
   */
  static fromDomainModel(
    survey: Survey,
    context: { flags: Map<string, FlagViewModelClientDto> },
  ) {
    const questionViewsByLabel: Map<string, SurveyQuestionViewModel> =
      new Map();

    survey.topLevelQuestionLabels.forEach((ql) => {
      const surveyQuestion = survey.questionBank.get(ql) as SurveyQuestion;

      const questionView: SurveyQuestionViewModel =
        SurveyViewModel.buildSurveyQuestionViewModel(
          surveyQuestion,
          survey.questionBank,
          context,
        );

      questionViewsByLabel.set(ql, questionView);
    });

    const analyzersByName = new Map<string, SurveyAnalyzerViewModel>();

    survey.analyzersByName.forEach((surveyAnalyzer, analyzerName) => {
      analyzersByName.set(
        analyzerName,
        SurveyAnalyzerViewModel.fromDomainModel(surveyAnalyzer),
      );
    });

    const result = new SurveyViewModel({
      id: survey.getId(),
      name: survey.getName(),
      size: survey.size(),
      questions: Array.from(questionViewsByLabel.values()),
      analyzersByName,
      isPublished: survey.isPublished,
    });

    return result;
  }
}
