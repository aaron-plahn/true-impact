import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from 'src/features/survey/survey.composite-identifier';
import { ImportSurvey } from './import-survey.command';

export class SurveyImportedPayload extends ImportSurvey {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}

export class SurveyImported {
  readonly type = 'SURVEY_IMPORTED';

  readonly payload: SurveyImportedPayload;

  constructor({ payload }: { payload: SurveyImportedPayload }) {
    this.payload = plainToInstance(SurveyImportedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyImported) {
    return new SurveyImported(dto);
  }
}
