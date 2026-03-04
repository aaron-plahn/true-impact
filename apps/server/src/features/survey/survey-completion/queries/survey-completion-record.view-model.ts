import {
  BooleanDataType,
  NestedDataType,
  NonEmptyString,
} from '../../../../libs/data-types';
import { DONE } from '../../constants';
import { SurveyQuestion } from '../../survey-management/survey-question.entity';
import { SurveyParticipantCompositeIdentifier } from '../survey-participant.composite-identifier';
import { SurveyResponseRecord } from '../survey-response-record.aggregate-root';

export class ActiveSurveyOptionViewModel {
  label: string;
  text: string;
  // do we want the follow-up question here?

  constructor({ label, text }: { label: string; text: string }) {
    this.label = label;

    this.text = text;
  }
}

export class ActiveSurveyQuestionViewModel {
  label: string;
  text: string;
  // ordered
  options: ActiveSurveyOptionViewModel[];

  constructor({
    label,
    text,
    options,
  }: {
    label: string;
    text: string;
    options: ActiveSurveyOptionViewModel[];
  }) {
    this.label = label;

    this.text = text;

    this.options = options;
  }
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
}

export class SurveyQuestionResponseViewModel {
  questionLabel: string;

  options: Map<string, SurveyResponseOptionViewModel>;

  constructor({
    questionLabel,
    options,
  }: {
    questionLabel: string;
    options: Map<string, SurveyResponseOptionViewModel>;
  }) {
    this.questionLabel = questionLabel;

    // clone
    this.options = new Map(options.entries());
  }

  // Once we have a dedicated query DB, we may want a `fromPersistenceDto`
}

export class SurveyCompletionRecordViewModel {
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
    responses,
    nextQuestion,
  }: {
    id: string;
    name: string;
    revision: string;
    hasBeenSubmitted: boolean;
    participantCompositeIdentifier: {
      type: string;
      id: string;
    } | null;
    responses: SurveyQuestionResponseViewModel[];
    nextQuestion: ActiveSurveyQuestionViewModel | null;
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
  }

  static fromDomainModel(
    domainModel: SurveyResponseRecord,
  ): SurveyCompletionRecordViewModel {
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
          text: nextQuestionDomainModel.prompt,
          options,
        };
      }
    }

    return new SurveyCompletionRecordViewModel({
      id: domainModel.id as string,
      revision: domainModel.revision.toString(),
      name: `${domainModel.survey.getName()}`, // TODO - participant name - attempt # or date started
      participantCompositeIdentifier: domainModel.participant || null,
      hasBeenSubmitted: domainModel.hasBeenSubmitted,
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

        const view: SurveyQuestionResponseViewModel = {
          questionLabel: r.questionLabel,
          options,
        };

        return view;
      }),
    });
  }
}
