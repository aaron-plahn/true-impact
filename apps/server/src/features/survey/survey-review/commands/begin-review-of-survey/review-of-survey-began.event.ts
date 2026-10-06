import { SurveyParticipantCompositeIdentifier } from '../../../../../features/survey/survey-completion/models';
import { NestedDataType, NonEmptyString } from '../../../../../libs/data-types';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class SurveyQuestionResponseRecordForEvent {
  @NonEmptyString({
    label: 'question label',
    description: 'identifies the question whose response is recorded here',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: 'identifies the option chosen by the participant',
  })
  optionLabel: string;
}

export class ReviewOfSurveyBeganPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'survey name',
    description: `name of the survey for which a partipant's response is being reviewed`,
  })
  /**
   * We cache this for the domain model in order to create more meaningful error messages.
   *
   * The view layer doesn't need it because it can denormalize off IDs.
   *
   * A transitive join (review (responseId) -> response (surveyId) -> survey) is required
   * for the original survey.
   *
   * Note that surveys are frozen once opened for completion. Immutability protects us from
   * inconsistencies due to non-atomic updates across aggregate boundaries.
   */
  surveyName: string;

  @NestedDataType(() => SurveyQuestionResponseRecordForEvent, {
    label: 'responses',
    description: `the participant's responses to each question in the order in which they were recorded`,
    isArray: true,
  })
  responses: SurveyQuestionResponseRecordForEvent[];

  // TODO is this necessary? We don't validate any invariants for this.
  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant composite ID',
    description:
      'system-wide unique reference to the participant who completed this survey',
    isOptional: true,
  })
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;

  constructor({
    aggregateCompositeIdentifier,
    surveyName,
    responses,
    participantCompositeIdentifier,
  }: ReviewOfSurveyBeganPayload) {
    this.aggregateCompositeIdentifier = aggregateCompositeIdentifier;

    this.surveyName = surveyName;

    this.responses = responses;

    this.participantCompositeIdentifier = participantCompositeIdentifier;
  }
}

export class ReviewOfSurveyBegan {
  readonly type = 'REVIEW_OF_SURVEY_BEGAN';

  readonly payload: ReviewOfSurveyBeganPayload;

  constructor({ payload }: { payload: ReviewOfSurveyBeganPayload }) {
    this.payload = new ReviewOfSurveyBeganPayload(payload);
  }

  static fromPersistenceDto(dto: ReviewOfSurveyBegan) {
    return new ReviewOfSurveyBegan(dto);
  }
}
