import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../../../../features/survey/survey.composite-identifier';
import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';

export class QuestionAddedToSurveyPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'label',
    description: 'identifies this question amongst others in the same survey',
  })
  label: string;

  @NonEmptyString({
    label: 'prompt',
    description: 'participant-facing text for this survey',
  })
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
