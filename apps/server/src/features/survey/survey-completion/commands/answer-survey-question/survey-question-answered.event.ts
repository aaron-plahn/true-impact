import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveyQuestionAnsweredPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
  questionLabel: string;
  chosenOptionLabel: string;
}

@TrueImpactDataExample<SurveyQuestionAnswered>({
  example: {
    type: 'SURVEY_QUESTION_ANSWERED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey response record',
        id: '444',
      },
      // We want these values to stand out in case we forget to override them and to avoid passing tests by coincidence.
      questionLabel: '120.V',
      chosenOptionLabel: 'Zeta',
    },
  },
})
export class SurveyQuestionAnswered {
  readonly type = 'SURVEY_QUESTION_ANSWERED';

  readonly payload: SurveyQuestionAnsweredPayload;

  constructor({ payload }: { payload: SurveyQuestionAnsweredPayload }) {
    this.payload = plainToInstance(SurveyQuestionAnsweredPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyQuestionAnswered) {
    return new SurveyQuestionAnswered(dto);
  }
}
