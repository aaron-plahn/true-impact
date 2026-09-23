import { SurveyCompositeIdentifier } from 'src/features/survey/survey.composite-identifier';

export class QuestionAddedToSurveyPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  label: string;
  prompt: string;
}

export class QuestionAddedToSurvey {
  readonly type = 'QUESTION_ADDED_TO_SURVEY';

  readonly payload: QuestionAddedToSurveyPayload;

  constructor({ payload }: { payload: QuestionAddedToSurveyPayload }) {
    this.payload = payload;
  }

  static fromPersistenceDto(dto: QuestionAddedToSurvey) {
    return new QuestionAddedToSurvey(dto);
  }
}
