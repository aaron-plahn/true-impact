import { CLIENT_AGGREGATE_TYPE } from '../../../../features/clients/client.composite-identifier';
import {
  BooleanDataType,
  deepConvertMapToObject,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { LookupTable } from '../../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import { DONE } from '../../constants';
import { SurveyViewModelClientDto } from '../../queries/survey.view-model';
import { SurveyQuestion } from '../../survey-management/survey-question.entity';
import { SurveyResponseRecord } from '../models';
import { SurveyParticipantCompositeIdentifier } from '../models/survey-participant.composite-identifier';
import {
  SurveyReportViewModel,
  SurveyReportViewModelClientDto,
} from './survey-report.view-model';

export class ActiveSurveyOptionViewModelClientDto {
  @NonEmptyString({
    label: 'label',
    description: 'a label for this option',
  })
  label: string;

  @NonEmptyString({
    label: 'text',
    description: 'the text for this option',
  })
  text: string;
}

export class ActiveSurveyOptionViewModel {
  label: string;
  text: string;
  // do we want the follow-up question here?

  constructor({ label, text }: { label: string; text: string }) {
    this.label = label;

    this.text = text;
  }

  toClientDto(): ActiveSurveyOptionViewModelClientDto {
    return {
      label: this.label,
      text: this.text,
    };
  }
}

export class ActiveSurveyQuestionViewModelClientDto {
  label: string;
  // This is an array because order is important to the client
  prompt: string;
  options: ActiveSurveyOptionViewModelClientDto[];
}

export class ActiveSurveyQuestionViewModel {
  label: string;
  prompt: string;
  // We use an array here because order is important to the client
  options: ActiveSurveyOptionViewModel[];

  constructor({
    label,
    prompt,
    options,
  }: {
    label: string;
    prompt: string;
    options: ActiveSurveyOptionViewModel[];
  }) {
    this.label = label;

    this.prompt = prompt;

    this.options = options;
  }
}

export class SurveyResponseOptionViewModelClientDto {
  @NonEmptyString({
    label: 'text',
    description: 'the text for this option',
  })
  text: string;

  @BooleanDataType({
    label: 'was chosen',
    description: 'Was this option selected by the user?',
  })
  wasChosen: boolean;
}

/**
 * We have an interesting design decision here. We can
 * 1. send back the questions and each question's options in arrays to
 * avoid requiring a separate order param \ sort on the client.
 * 2. send back the questions and each question's options in a record \ map
 * to maintain composability of deltas
 */
export class SurveyResponseOptionViewModel {
  text: string;
  wasChosen: boolean;
  // chosenAt: string; // timestamp

  constructor({ text, wasChosen }: { text: string; wasChosen: boolean }) {
    this.text = text;

    this.wasChosen = wasChosen;
  }

  toClientDto(): SurveyResponseOptionViewModelClientDto {
    return {
      text: 'because I feel this way in my gut',
      wasChosen: true,
    };
  }
}

export class SurveyQuestionResponseViewModelClientDto {
  @NonEmptyString({
    label: 'question label',
    description: 'label for this question',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'prompt',
    description:
      'the wording of this question as it was presented to the participant',
  })
  prompt: string; // TODO ML Text

  @LookupTable(() => SurveyResponseOptionViewModelClientDto, {
    label: 'options',
    description:
      'a lookup table of all options that were available for this question',
  })
  options: Record<string, SurveyResponseOptionViewModelClientDto>;
}

export class SurveyQuestionResponseViewModel {
  questionLabel: string;

  prompt: string;

  options: Map<string, SurveyResponseOptionViewModel>;

  chosenOptionLabel: string;

  constructor({
    questionLabel,
    prompt,
    options,
  }: {
    questionLabel: string;
    prompt: string;
    options: Map<string, SurveyResponseOptionViewModel>;
  }) {
    this.questionLabel = questionLabel;

    // clone
    this.options = new Map(options.entries());

    this.prompt = prompt;
  }

  toClientDto(): SurveyQuestionResponseViewModelClientDto {
    return {
      questionLabel: this.questionLabel,
      prompt: this.prompt,
      options: deepConvertMapToObject(this.options),
    };
  }

  // Once we have a dedicated query DB, we may want a `fromPersistenceDto`
}

@TrueImpactDataExample<SurveyResponseRecordViewModelClientDto>({
  example: {
    id: '1',
    size: 5,
    name: 'long survey',
    revision: '5',
    hasBeenSubmitted: false,
    hasBeenCancelled: false,
    participantCompositeIdentifier: {
      type: CLIENT_AGGREGATE_TYPE,
      id: 'c99',
    },
    reportsByName: {},
    responses: [
      {
        questionLabel: '1',
        prompt: 'I like this question!',
        options: {
          a: {
            text: 'yes',
            wasChosen: false,
          },
          b: {
            text: 'no',
            wasChosen: true,
          },
          c: {
            text: 'maybe',
            wasChosen: false,
          },
        },
      },
      {
        questionLabel: '2',
        prompt: 'I like surveys in general.',
        options: {
          a: {
            text: 'yes',
            wasChosen: false,
          },
          b: {
            text: 'no',
            wasChosen: true,
          },
          c: {
            text: 'maybe',
            wasChosen: false,
          },
        },
      },
      {
        questionLabel: '3',
        prompt: 'I intend to respond to more of your surveys.',
        options: {
          a: {
            text: 'yes',
            wasChosen: false,
          },
          b: {
            text: 'no',
            wasChosen: true,
          },
          c: {
            text: 'maybe',
            wasChosen: false,
          },
        },
      },
    ],
    nextQuestion: {
      label: '4',
      prompt: 'This is the next question that should be displayed in the UX.',
      options: [
        {
          label: 'a',
          text: 'sometimes',
        },
        {
          label: 'b',
          text: 'never',
        },
      ],
    },
  },
})
export class SurveyResponseRecordViewModelClientDto {
  @NonEmptyString({
    label: 'id',
    description: `a unique identifier for this survey attempt`,
  })
  id: string;

  @BooleanDataType({
    label: 'has been cancelled',
    description:
      'Has this attempt been cancelled in order to start a new attempt of the same survey?',
  })
  hasBeenCancelled: boolean;

  @NonEmptyString({
    label: 'name',
    description: 'a top-level label for this survey attempt',
  })
  name: string;

  @NonEmptyString({
    label: 'revision ID',
    description: `helps to identify when a survey attempt has been updated`,
  })
  revision: string;

  @NonNegativeInteger({
    label: 'size',
    description:
      'total number of questions in this survey (including optional questions)',
  })
  size: number;

  reportsByName: Record<string, SurveyReportViewModelClientDto>;

  /**
   * TODO Support time stamps \ auditable completion history
   */
  // @NonEmptyString({
  //   label: 'date started',
  //   description:
  //     'the date and time at which the user began completing the survey',
  // })
  // dateStarted: string;

  // @NonEmptyString({
  //   label: 'date completed',
  //   description: 'the date and time at which the user submitted the survey',
  // })
  // dateCompleted?: string;

  @BooleanDataType({
    label: 'has been submitted',
    description: 'has this survey been submitted by the participant?',
  })
  hasBeenSubmitted: boolean;

  @NonEmptyString({
    label: 'participant identifier',
    description:
      'a system-wide unique identifier for the participant who completed this survey',
  })
  participantCompositeIdentifier: SurveyParticipantCompositeIdentifier | null;

  @NestedDataType(() => SurveyQuestionResponseViewModelClientDto, {
    label: 'responses',
    description: `an ordered list of user responses to this survey's question`,
    isArray: true,
    // A survey completion record is empty at first
    isOptional: true, // i.e., can be empty
  })
  responses: SurveyQuestionResponseViewModelClientDto[];

  @NestedDataType(() => ActiveSurveyQuestionViewModel, {
    label: 'next question',
    description: 'this is the next question the user should complete',
  })
  nextQuestion: ActiveSurveyQuestionViewModelClientDto | null;
}

export class SurveyResponseRecordViewModel {
  @NonEmptyString({
    label: 'id',
    description: `a unique identifier for this survey attempt`,
  })
  id: string;

  @NonEmptyString({
    label: 'name',
    description: 'a top-level label for this survey attempt',
  })
  name: string;

  @NonEmptyString({
    label: 'revision ID',
    description: `helps to identify when a survey attempt has been updated`,
  })
  revision: string;

  @NonNegativeInteger({
    label: 'size',
    description:
      'the total number of questions in this survey (including optional questions)',
  })
  size: number;

  @LookupTable(() => SurveyReportViewModel, {
    label: 'reports by name',
    description: `reports that have been configured to be calculated from a participant's reponses`,
  })
  reportsByName = new Map<string, SurveyReportViewModel>();

  /**
   * TODO Support time stamps \ auditable completion history
   */
  // @NonEmptyString({
  //   label: 'date started',
  //   description:
  //     'the date and time at which the user began completing the survey',
  // })
  // dateStarted: string;

  // @NonEmptyString({
  //   label: 'date completed',
  //   description: 'the date and time at which the user submitted the survey',
  // })
  // dateCompleted?: string;

  @BooleanDataType({
    label: 'has been submitted',
    description: 'Has this survey been submitted by the participant?',
  })
  hasBeenSubmitted: boolean;

  @BooleanDataType({
    label: 'has been cancelled',
    description:
      'Has this survey been cancelled in order to start another attempt of the same survey?',
  })
  hasBeenCancelled: boolean;

  @NonEmptyString({
    label: 'participant identifier',
    description:
      'a system-wide unique identifier for the participant who completed this survey',
  })
  participantCompositeIdentifier: SurveyParticipantCompositeIdentifier | null;

  @NestedDataType(() => SurveyQuestionResponseViewModel, {
    label: 'responses',
    description: `an ordered list of user responses to this survey's question`,
    isArray: true,
    // A survey completion record is empty at first
    isOptional: true, // i.e., can be empty
  })
  responses: SurveyQuestionResponseViewModel[];

  @NestedDataType(() => ActiveSurveyQuestionViewModel, {
    label: 'next question',
    description: 'this is the next question the user should complete',
  })
  nextQuestion: ActiveSurveyQuestionViewModel | null;

  constructor({
    id,
    name,
    revision,
    participantCompositeIdentifier,
    hasBeenSubmitted,
    hasBeenCancelled,
    responses,
    nextQuestion,
    size,
  }: {
    id: string;
    name: string;
    revision: string;
    hasBeenSubmitted: boolean;
    hasBeenCancelled: boolean;
    participantCompositeIdentifier: {
      type: string;
      id: string;
    } | null;
    responses: SurveyQuestionResponseViewModel[];
    nextQuestion: ActiveSurveyQuestionViewModel | null;
    size: number;
  }) {
    this.name = name;

    this.id = id;

    this.revision = revision;

    if (participantCompositeIdentifier) {
      this.participantCompositeIdentifier = {
        type: participantCompositeIdentifier.type,
        id: participantCompositeIdentifier.id,
      };
    }

    this.responses = responses.map(
      (r) => new SurveyQuestionResponseViewModel(r),
    );

    this.nextQuestion = nextQuestion
      ? new ActiveSurveyQuestionViewModel(nextQuestion)
      : null;

    this.hasBeenSubmitted = hasBeenSubmitted;

    this.hasBeenCancelled = hasBeenCancelled;

    this.size = size;
  }

  appendReport(report: SurveyReportViewModel): SurveyResponseRecordViewModel {
    this.reportsByName.set(report.name, report);

    return this;
  }

  toClientDto(): SurveyResponseRecordViewModelClientDto {
    const reportsByName = new Map<string, SurveyReportViewModelClientDto>();

    Array.from(this.reportsByName.entries()).forEach(
      ([reportName, reportView]) =>
        reportsByName.set(reportName, reportView.toClientDto()),
    );

    return {
      id: this.id,
      name: this.name,
      revision: this.revision,
      hasBeenSubmitted: this.hasBeenSubmitted,
      hasBeenCancelled: this.hasBeenCancelled,
      participantCompositeIdentifier: this.participantCompositeIdentifier,
      responses: this.responses.map((response) => response.toClientDto()),
      nextQuestion: this.nextQuestion,
      size: this.size,
      reportsByName: deepConvertMapToObject(reportsByName),
    };
  }

  static fromDomainModel(
    domainModel: SurveyResponseRecord,
    { surveysById }: { surveysById: Map<string, SurveyViewModelClientDto> },
  ): SurveyResponseRecordViewModel {
    let nextQuestionViewModel: ActiveSurveyQuestionViewModel | null = null;

    const nextQuestionLabel = domainModel.getNextQuestionLabel();

    if (nextQuestionLabel && nextQuestionLabel !== DONE) {
      const nextQuestionDomainModel = domainModel.survey.get(nextQuestionLabel);

      if (nextQuestionDomainModel) {
        const options: ActiveSurveyOptionViewModel[] = Array.from(
          nextQuestionDomainModel.options.entries(),
        ).map(
          ([label, { text }]) =>
            new ActiveSurveyOptionViewModel({
              label,
              text,
            }),
        );

        nextQuestionViewModel = {
          label: nextQuestionDomainModel.label,
          prompt: nextQuestionDomainModel.prompt,
          options,
        };
      }
    }

    const draft = new SurveyResponseRecordViewModel({
      id: domainModel.id,
      size: domainModel.survey.size(),
      revision: domainModel.revision.toString(),
      name: `${domainModel.survey.getName()}`, // TODO - participant name - attempt # or date started
      participantCompositeIdentifier: domainModel.participant || null,
      hasBeenSubmitted: domainModel.hasBeenSubmitted,
      hasBeenCancelled: domainModel.hasBeenCancelled,
      nextQuestion: nextQuestionViewModel,
      responses: domainModel.responses.map((r) => {
        const targetQuestion = domainModel.survey.get(
          r.questionLabel,
        ) as SurveyQuestion; // TODO how can we fail gracefully? It would be a system error for the question not to exist

        const options = new Map<string, SurveyResponseOptionViewModel>();

        targetQuestion.options.forEach((o) => {
          const view = new SurveyResponseOptionViewModel({
            text: o.text,
            wasChosen: o.label === r.optionLabel,
          });

          options.set(o.label, view);
        });

        const view = new SurveyQuestionResponseViewModel({
          questionLabel: r.questionLabel,
          options,
          prompt: targetQuestion.prompt,
        });

        return view;
      }),
    });

    const updatedSurveyFromContext = surveysById.get(domainModel.survey.id);

    if (updatedSurveyFromContext) {
      Object.entries(updatedSurveyFromContext.analyzersByName).forEach(
        ([_reportName, analyzer]) => {
          // TODO inject an analyzer instance, not a DTO here
          const report = domainModel.responses.reduce(
            (acc: SurveyReportViewModel, response) => {
              const {
                questionLabel: targetQuestionLabel,
                optionLabel: chosenOptionLabel,
              } = response;

              const valuesForQuestion =
                analyzer.valuesByOptionByQuestion[targetQuestionLabel];

              if (valuesForQuestion) {
                const valuesForOption = valuesForQuestion[chosenOptionLabel];

                if (valuesForOption) {
                  Object.entries(valuesForOption).forEach(
                    ([category, value]) => {
                      // why a side-effect here only? Isn't this confusing?
                      acc.add(category, value);
                    },
                  );
                }
              }

              return acc;
            },
            new SurveyReportViewModel({
              name: analyzer.name,
              categories: analyzer.categories,
            }),
          );

          draft.appendReport(report);
        },
      );
    }

    return draft;
  }
}
