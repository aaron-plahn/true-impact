import { SurveyCompositeIdentifier } from 'src/features/survey/survey.composite-identifier';

export class SurveyImportedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  // TODO this is a big one!
}

export class SurveyImported {
  readonly type = 'SURVEY_IMPORTED';
}
