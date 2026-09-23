import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyOptionFlaggedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  flagId: string;
}

// TODO data examples
export class SurveyOptionFlagged {
  readonly type = 'SURVEY_OPTION_FLAGGED';

  readonly payload: SurveyOptionFlaggedPayload;

  constructor({ payload }: { payload: SurveyOptionFlaggedPayload }) {
    this.payload = plainToInstance(SurveyOptionFlaggedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyOptionFlagged) {
    return new SurveyOptionFlagged(dto);
  }
}
