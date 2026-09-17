import { SurveyQuestionPersistenceDto } from '../../../../../features/survey/survey-management/survey-question.entity';
import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';
import {
  SurveyParticipantCompositeIdentifier,
  SurveyResponseCompositeIdentifier,
} from '../../models';

export class SurveyInfoForResponseRecord {
  id: string;
  // validated to be true and survey is frozen before this point
  // isFinal: boolean;
  name: string;
  questions: Record<string, Omit<SurveyQuestionPersistenceDto, 'label'>>;
  topLevelQuestionLabels: string[];
  revision: number;
}

export class SurveyBeganPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant',
    description: 'the participant (unless completion is anonymous)',
  })
  participant?: SurveyParticipantCompositeIdentifier;

  @NestedDataType(() => SurveyInfoForResponseRecord, {
    label: 'survey',
    description:
      'cached information about this survey relevant to its completion',
  })
  survey: SurveyInfoForResponseRecord; // SurveyInfoForResponseRecord
}

// TODO `BaseEvent` class?`
@TrueImpactDataExample<SurveyBegan>({
  example: {
    type: 'SURVEY_BEGAN',
    revision: 1,
    streamId: 'survey response record/55',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey response record',
        id: '55',
      },
      survey: {
        id: '123',
        name: 'My Test Survey',
        questions: {},
        topLevelQuestionLabels: [],
        revision: 0,
      },
    },
    // TODO buildTestInstance(EventMetadata)
    meta: {},
  },
})
export class SurveyBegan {
  readonly type = 'SURVEY_BEGAN';

  // id = `${this.streamId}/${this.revision}`

  readonly payload: SurveyBeganPayload;

  // TODO shared `EventMetadata` class
  readonly meta: Record<string, unknown>;

  /**
   * TODO We might want to make this a calculated field using: `${this.payload.aggregateCompositeIdentifier.type}/${this.payload.aggregateCompositeIdentifier.id}`
   * as each stream targets a single aggregate root. But this approach prevents using the stream ID to store a system-wide unique filed (such as  
   * streamId = `survey/{surveyName}`) in the future.
   */
  @NonEmptyString({
    label: 'stream ID',
    description: `groups all events for this event's target aggregate`,
  })
  readonly streamId: string;

  /**
   * This is a creation command.
   */
  readonly revision: number = 0;

  // TODO META
  constructor(event: {
    payload: SurveyBeganPayload;
    meta: Record<string, unknown>;
    streamId: string;
  }) {
    const { payload, meta, streamId } = event;
    // Should this turn a DTO into an instance of the Survey Began Payload?
    this.payload = payload;

    this.meta = meta;

    this.streamId = streamId;
  }

  // TODO is this really what we want here?
  // TODO do we validate the schema?
  static fromPersistenceDto(event: SurveyBegan): SurveyBegan {
    return new SurveyBegan(event);
  }
}
