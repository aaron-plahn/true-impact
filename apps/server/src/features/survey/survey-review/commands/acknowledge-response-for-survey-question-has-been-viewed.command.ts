import { NestedDataType, NonEmptyString } from '../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../survey-completion';

export class AcknowledgeResponseForSurveyQuestionHasBeenViewed {
  static readonly type =
    'ACKNOWLEDGE_RESPONSE_FOR_SURVEY_QUESTION_HAS_BEEN_VIEWED';

  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'the label of the question you have now viewed',
  })
  questionLabel: string;
}
