import { plainToInstance } from 'class-transformer';
import { SurveyParticipantCompositeIdentifier } from '../../survey-completion/models';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyAccessCodeRedeemedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  hashedAccessCode: string;
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
}

export class SurveyAccessCodeRedeemed {
  readonly type = 'SURVEY_ACCESS_CODE_REDEEMED';
  readonly payload: SurveyAccessCodeRedeemedPayload;

  constructor({ payload }: { payload: SurveyAccessCodeRedeemedPayload }) {
    this.payload = plainToInstance(SurveyAccessCodeRedeemedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyAccessCodeRedeemed) {
    return new SurveyAccessCodeRedeemed(dto);
  }
}
