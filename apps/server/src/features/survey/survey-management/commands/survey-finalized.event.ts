import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyFinalizedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}

export class SurveyFinalized {
  readonly type = 'SURVEY_FINALIZED';

  readonly payload: SurveyFinalizedPayload;

  constructor({ payload }: { payload: SurveyFinalizedPayload }) {
    this.payload = plainToInstance(SurveyFinalizedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyFinalized) {
    return new SurveyFinalized(dto);
  }
}
