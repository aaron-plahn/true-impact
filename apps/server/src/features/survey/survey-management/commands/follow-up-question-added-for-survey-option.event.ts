import { plainToInstance } from 'class-transformer';
import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

export class FollowUpQuestionAddedForSurveyOptionPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'question whose option has a follow up question',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description:
      'option for which to present the participant with the follow up question',
  })
  optionLabel: string;

  @NonEmptyString({
    label: 'follow up question label',
    description:
      'uniquely identifies the follow up question amongst other questions in the same survey',
  })
  followUpQuestionLabel: string;

  @NonEmptyString({
    label: 'follow up question prompt',
    description: 'wording of this question to show the user',
  })
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
