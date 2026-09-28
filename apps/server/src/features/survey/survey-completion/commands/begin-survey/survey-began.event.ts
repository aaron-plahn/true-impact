import { plainToInstance } from 'class-transformer';
import { SurveyPersistenceDto } from '../../../../../features/survey/survey-management';
import {
  NestedDataType,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';
import { SurveyParticipantCompositeIdentifier } from '../../models';
import { SurveyResponseCompositeIdentifier } from '../../models/survey-response-record.composite-identifier';

export class SurveyBeganPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant',
    description: 'the participant (unless completion is anonymous)',
  })
  participant?: SurveyParticipantCompositeIdentifier;

  @NestedDataType(() => SurveyPersistenceDto, {
    label: 'survey',
    description:
      'cached information about this survey relevant to its completion',
  })
  survey: SurveyPersistenceDto; // SurveyInfoForResponseRecord
}

// TODO `BaseEvent` class?`
@TrueImpactDataExample<SurveyBegan>({
  example: {
    type: 'SURVEY_BEGAN',
    revision: 1,
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey response record',
        id: '55',
      },
      survey: {
        id: '123',
        // this should always be true if we've made it to the point of survey completion
        isFinal: true,
        name: 'My Test Survey',
        questions: {},
        topLevelQuestionLabels: [],
        revision: 0,
        analyzers: {},
        accessTokensByHash: {},
      },
    },
    // TODO buildTestInstance(EventMetadata)
    metadata: {},
  },
})
export class SurveyBegan {
  readonly type = 'SURVEY_BEGAN';

  // id = `${this.streamId}/${this.revision}`

  readonly payload: SurveyBeganPayload;

  // TODO shared `EventMetadata` class
  readonly metadata: Record<string, unknown>;

  /**
   * This is a creation event. The new aggregate root will have revision:0 until this
   * event is persisted, at which point it will come back as 1 (assuming there are no update events for the target aggregate root).
   */
  readonly revision: number = 1;

  constructor(event: {
    payload: SurveyBeganPayload;
    metadata: Record<string, unknown>;
  }) {
    const { payload, metadata } = event;

    this.payload = plainToInstance(SurveyBeganPayload, payload);

    // We should apply metadata at a higher level.
    this.metadata = metadata;
  }

  // TODO is this really what we want here?
  // TODO do we validate the schema?
  static fromPersistenceDto(event: SurveyBegan): SurveyBegan {
    return new SurveyBegan(event);
  }
}
