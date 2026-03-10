import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

@TrueImpactDataExample<CreateAnalyzerForSurvey>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '123',
    },
    name: 'Medicine Wheel 3',
  },
})
export class CreateAnalyzerForSurvey {
  static readonly type = 'CREATE_ANALYZER_FOR_SURVEY';

  @NestedDataType(() => SurveyCompositeIdentifier, {
    label: 'composite ID',
    description: 'a system-wide unique identifier for this survey',
  })
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'analyzer name',
    description: 'the name for this survey analysis approach',
  })
  name: string;
}
