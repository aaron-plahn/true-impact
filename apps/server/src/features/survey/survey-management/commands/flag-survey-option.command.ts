import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

@TrueImpactDataExample<FlagSurveyOption>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '1',
    },
    questionLabel: '1',
    optionLabel: 'a',
    flagId: '5',
  },
})
export class FlagSurveyOption {
  static readonly type = 'FLAG_SURVEY_OPTION';

  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'question that has the option that will be flagged',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: 'the option that is being flagged',
  })
  optionLabel: string;

  @NonEmptyString({
    label: 'flag ID',
    description:
      'reference to the flag that is being added for this survey option',
  })
  flagId: string;
}
