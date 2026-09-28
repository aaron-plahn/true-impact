import { plainToInstance } from 'class-transformer';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../../../../features/survey/survey.composite-identifier';

/**
 * We leverage the various update commands on a survey
 * when importing a survey. This leads to several "ordinary"
 * survey events in the event history. We add an additional
 * "SURVEY_IMPORTED" so that we can identify this as a survey
 * that was imported in a list view, for example.
 */
export class SurveyImportedPayload {
  @SurveyCompositeIdentifierValuedProp
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
