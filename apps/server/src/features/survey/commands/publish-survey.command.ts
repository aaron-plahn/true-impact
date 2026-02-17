import { TrueImpactDataExample } from 'src/libs';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';

@TrueImpactDataExample({
  example: {
    AGGREGATE_COMPOSITE_IDENTIFIER: {
      type: 'survey',
      id: '1',
    },
  },
})
export class PublishSurvey {
  static readonly type = 'PUBLISH_SURVEY';

  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}
