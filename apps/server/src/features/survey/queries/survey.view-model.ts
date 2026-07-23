import { FlagViewModelClientDto } from '../../../features/flags/queries';
import {
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { LookupTable } from '../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
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
@TrueImpactDataExample<SurveyViewModelClientDto>({
  example: {
    id: '1',
    isPublished: false,
    isOpenToPublic: false,
    name: 'Food Allergies Survey',
    size: 10,
    analyzersByName: {},
    questions: Array(10)
      .fill(null)
      .map((_, index) => ({
        label: `label for test question ${index + 1}`,
        prompt: `How would you like to answer question ${index + 1}`,
        options: {
          a: {
            label: 'a',
            text: `strongly agree`,
            followUpQuestions: [
              {
                label: `${index + 1}-fu-1`,
                prompt: `Why do you agree with everything I say?`,
                options: {
                  a: {
                    label: 'a',
                    text: 'I am weak.',
                    followUpQuestions: [],
                    flags: {},
                  },
                  b: {
                    label: 'b',
                    text: 'I do not take this survey seriously.',
                    followUpQuestions: [
                      {
                        label: `${index + 1}-fu-1.1`,
                        prompt: `Do you ever take anything seriously?`,
                        options: {
                          a: {
                            label: 'a',
                            text: 'yes',
                            flags: {},
                            followUpQuestions: [],
                          },
                          b: {
                            label: 'b',
                            text: 'no',
                            flags: {
                              f101: {
                                id: 'f101',
                                label: 'chill',
                                description: 'this client is super chill',
                              },
                            },
                            followUpQuestions: [],
                          },
                        },
                      },
                    ],
                    flags: {},
                  },
                  c: {
                    label: 'c',
                    text: 'You are really smart.',
                    followUpQuestions: [],
                    flags: {},
                  },
                  d: {
                    label: 'c',
                    text: 'I was sent here to annoy you.',
                    followUpQuestions: [],
                    flags: {
                      f55: {
                        id: 'f55',
                        label: 'sarcasm',
                        description: 'this client is always being sarcastic',
                      },
                    },
                  },
                },
              },
            ],
            flags: {
              f123: {
                id: 'f123',
                label: 'too aggreeable',
                description: 'will say yes to any question asked',
              },
            },
          },
          b: {
            label: 'b',
            text: `agree`,
            followUpQuestions: [],
            flags: {},
          },
          c: {
            label: 'c',
            text: `disagree`,
            followUpQuestions: [],
            flags: {},
          },
          d: {
            label: 'd',
            text: `strongly disagree`,
            flags: {
              f123: {
                id: 'f125',
                label: 'grumpy',
                description: 'always in a bad moody',
              },
              f199: {
                id: 'f199',
                label: 'dangerous',
                description: 'this one is fiesty!',
              },
            },
            followUpQuestions: [],
          },
        },
      })),
  },
})
export class SurveyViewModelClientDto {
  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for this survey',
  })
  id: string;

  @NonEmptyString({
    label: 'is published',
    description:
      'once published, a survey is available for completion by eligible participants',
  })
  isPublished: boolean;

  @NonEmptyString({
    label: 'is open to public',
    description:
      'can this survey be completed by members of the general public?',
  })
  isOpenToPublic: boolean;

  // TODO Multilingual Text
  @NonEmptyString({
    label: 'name',
    description: 'name of this survey',
  })
  name: string;

  @NonNegativeInteger({
    label: 'size',
    description: 'the current number of questions in this survey',
  })
  size: number;

  @LookupTable(() => SurveyAnalyzerViewModelClientDto, {
    label: 'analyzers by name',
    description:
      'a lookup table of all available approaches to quantify responses to this survey',
  })
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

  isOpenToPublic: boolean;

  constructor({
    id,
    name,
    size,
    analyzersByName,
    questions,
    isPublished,
    isOpenToPublic,
  }: {
    id: string;
    name: string;
    size: number;
    questions?: SurveyQuestionViewModel[];
    analyzersByName: Map<string, SurveyAnalyzerViewModel>;
    isPublished: boolean;
    isOpenToPublic: boolean;
  }) {
    this.id = id;

    this.name = name;

    this.size = size;

    this.questions = questions || [];

    this.isPublished = typeof isPublished === 'boolean' ? isPublished : false;

    this.isOpenToPublic =
      typeof isOpenToPublic === 'boolean' ? isPublished : false;

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
      isOpenToPublic: this.isOpenToPublic,
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
                  ), // We do this to avoid circularities with our type definitions when recursing
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
      isOpenToPublic: survey.isOpenToPublic,
    });

    return result;
  }
}
