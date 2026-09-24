import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class FollowUpQuestionAddedForSurveyOptionPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  questionLabel: string;
  optionLabel: string;
  followUpQuestionLabel: string;
  followUpQuestionPrompt: string;
}

@TrueImpactDataExample<FollowUpQuestionAddedForSurveyOption>({
  example: {
    type: 'FOLLOW-UP_QUESTION_ADDED_FOR_SURVEY',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '55',
      },
      questionLabel: 'II',
      optionLabel: 'Q',
      followUpQuestionLabel: 'Q.1',
      followUpQuestionPrompt: 'Do you like my test follow-up question?',
    },
  },
})
export class FollowUpQuestionAddedForSurveyOption {
  readonly type = 'FOLLOW-UP_QUESTION_ADDED_FOR_SURVEY';

  readonly payload: FollowUpQuestionAddedForSurveyOptionPayload;

  constructor({
    payload,
  }: {
    payload: FollowUpQuestionAddedForSurveyOptionPayload;
  }) {
    this.payload = plainToInstance(
      FollowUpQuestionAddedForSurveyOptionPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: FollowUpQuestionAddedForSurveyOption) {
    return new FollowUpQuestionAddedForSurveyOption(dto);
  }
}
