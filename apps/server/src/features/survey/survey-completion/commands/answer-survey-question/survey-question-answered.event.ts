import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveyQuestionAnsweredPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
  questionLabel: string;
  chosenOptionLabel: string;
}

export class SurveyQuestionAnswered {
  readonly type = 'SURVEY_QUESTION_ANSWERED';

  readonly payload: SurveyQuestionAnsweredPayload;

  constructor({ payload }: { payload: SurveyQuestionAnsweredPayload }) {
    this.payload = payload;
  }
}
