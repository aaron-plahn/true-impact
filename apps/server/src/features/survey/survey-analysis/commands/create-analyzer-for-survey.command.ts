import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

@TrueImpactDataExample<CreateAnalyzer>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '123',
    },
    name: 'Medicine Wheel 3',
  },
})
export class CreateAnalyzer {
  static readonly type = 'CREATE_ANALYZER';

  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'analyzer name',
    description: 'the name for this survey analysis approach',
  })
  name: string;
}
