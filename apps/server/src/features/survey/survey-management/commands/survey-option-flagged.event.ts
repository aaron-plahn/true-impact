import { plainToInstance } from 'class-transformer';
import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

export class SurveyOptionFlaggedPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'flag ID',
    description:
      'identifies a flag that is raised when the specific option is chosen',
  })
  flagId: string;

  @NonEmptyString({
    label: 'question label',
    description: 'identifies the question that holds the relevant option',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: 'identifies the relevant option',
  })
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
