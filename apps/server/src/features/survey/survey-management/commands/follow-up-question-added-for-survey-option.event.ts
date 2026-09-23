import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class FollowUpQuestionAddedForSurveyOptionPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  questionLabel: string;
  optionLabel: string;
  followUpQuestionLabel: string;
  followUpQuestionPrompt: string;
}

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
