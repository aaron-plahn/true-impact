import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyOptionFlaggedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  flagId: string;
  questionLabel: string;
  optionLabel: string;
}

@TrueImpactDataExample<SurveyOptionFlagged>({
  example: {
    type: 'SURVEY_OPTION_FLAGGED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '303',
      },
      flagId: '33',
      questionLabel: '1',
      optionLabel: 'a',
    },
  },
})
export class SurveyOptionFlagged {
  readonly type = 'SURVEY_OPTION_FLAGGED';

  readonly payload: SurveyOptionFlaggedPayload;

  constructor({ payload }: { payload: SurveyOptionFlaggedPayload }) {
    this.payload = plainToInstance(SurveyOptionFlaggedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyOptionFlagged) {
    return new SurveyOptionFlagged(dto);
  }
}
