import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from 'src/features/survey/survey.composite-identifier';

export class SurveyOpenedToPublicPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}

export class SurveyOpenedToPublic {
  readonly type = 'SURVEY_OPENED_TO_PUBLIC';

  readonly payload: SurveyOpenedToPublicPayload;

  constructor({ payload }: { payload: SurveyOpenedToPublicPayload }) {
    this.payload = plainToInstance(SurveyOpenedToPublicPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyOpenedToPublic) {
    return new SurveyOpenedToPublic(dto);
  }
}
