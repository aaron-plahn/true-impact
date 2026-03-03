import { NestedDataType, NonEmptyString } from '../../../../libs/data-types';
import { SurveyParticipantCompositeIdentifier } from '../survey-participant.composite-identifier';
import { SurveyResponseRecord } from '../survey-response-record.aggregate-root';

export class ActiveSurveyOptionViewModel {
  label: string;
  text: string;
  // do we want the follow-up question here?
}

export class ActiveSurveyQuestionViewModel {
  label: string;
  text: string;
  // ordered
  options: ActiveSurveyOptionViewModel[];
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
  chosenAt: string; // timestamp
}

export class SurveyQuestionResponseViewModel {
  questionLabel: string;
  options: Map<string, SurveyResponseOptionViewModel>;
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

  @NonEmptyString({
    label: 'date started',
    description:
      'the date and time at which the user began completing the survey',
  })
  dateStarted: string; // UNIX timestamp ?

  @NonEmptyString({
    label: 'date completed',
    description: 'the date and time at which the user submitted the survey',
  })
  dateCompleted?: string;

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
    dateStarted,
    dateCompleted,
    participantCompositeIdentifier,
  }: {
    id: string;
    name: string;
    revision: string;
    dateStarted: string;
    dateCompleted: string;
    participantCompositeIdentifier: {
      type: string;
      id: string;
    } | null;
  }) {
    this.name = name;

    this.id = id;

    this.revision = revision;

    this.dateStarted = dateStarted;

    this.dateCompleted = dateCompleted;

    if (participantCompositeIdentifier) {
      this.participantCompositeIdentifier = {
        type: participantCompositeIdentifier.type,
        id: participantCompositeIdentifier.id,
      };
    }

    this.responses = []; // TODO set this

    this.nextQuestion = null; // TODO Set this
  }

  static fromDomainModel(
    domainModel: SurveyResponseRecord,
  ): SurveyCompletionRecordViewModel {
    return new SurveyCompletionRecordViewModel({
      id: domainModel.id as string,
      revision: domainModel.revision.toString(),
      dateStarted: '', // TODO we need an event history or else we need to put these on the domain model
      dateCompleted: '',
      name: `${domainModel.survey.getName()}`, // TODO - participant name - attempt # or date started
      participantCompositeIdentifier: domainModel.participant || null,
    });
  }
}
