import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

@TrueImpactDataExample<CreateSurvey>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '123',
    },
    name: 'Program Engagement Survey',
  },
})
export class CreateSurvey {
  static readonly type = 'CREATE_SURVEY';

  // TODO Decorator
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'survey name',
    description: 'the name of this survey',
    isArray: false,
    isOptional: false,
  })
  name: string;

  // languageCode
}
