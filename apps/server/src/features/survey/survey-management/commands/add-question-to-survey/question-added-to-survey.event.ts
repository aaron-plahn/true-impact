import { SurveyCompositeIdentifier } from '../../../../../features/survey/survey.composite-identifier';
import { TrueImpactDataExample } from '../../../../../libs/data-types';

export class QuestionAddedToSurveyPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  label: string;
  prompt: string;
}

@TrueImpactDataExample<QuestionAddedToSurvey>({
  example: {
    type: 'QUESTION_ADDED_TO_SURVEY',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '55',
      },
      label: 'my test question',
      prompt: 'Do you like my test question?',
    },
  },
})
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
