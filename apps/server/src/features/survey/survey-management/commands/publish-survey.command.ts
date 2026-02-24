import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

@TrueImpactDataExample({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '1',
    },
  },
})
export class PublishSurvey {
  static readonly type = 'PUBLISH_SURVEY';

  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}
