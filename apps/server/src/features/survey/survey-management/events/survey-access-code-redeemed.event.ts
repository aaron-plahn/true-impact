import { plainToInstance } from 'class-transformer';
import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import { SurveyParticipantCompositeIdentifier } from '../../survey-completion/models/survey-participant.composite-identifier';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

export class SurveyAccessCodeRedeemedPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  /**
   * Note that this must be persisted. It is hashed, but still
   * should be treated as private. We might want an @Sensitive
   * decorator to enforce this. In general, we shouldn't log arbitrary
   * event payloads anyway.
   */
  @NonEmptyString({
    label: 'access code',
    description:
      // The user \ admin receives this in the clear.
      'hashed (encyrpted) version of the temporary access code redeemable for a survey completion session',
  })
  hashedAccessCode: string;

  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant composite ID',
    description: 'system-wide unique identifier for the survey participant',
    isOptional: true,
  })
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
