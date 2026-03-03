import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';
import { SurveyResponseCompositeIdentifier } from '../survey-response-record.aggregate-root';

@TrueImpactDataExample<AnswerSurveyQuestion>({
  example: {
    aggregateCompositeIdentifier: {
      type: SURVEY_RESPONSE_AGGREGATE_TYPE,
      id: '123',
    },
    questionLabel: '1',
    chosenOptionLabel: 'b',
  },
})
export class AnswerSurveyQuestion {
  static readonly type = 'ANSWER_SURVEY_QUESTION';

  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'composite identifier',
    description: 'a system-wide unique identifier for this survey attempt',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'user-facing label for this question',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: 'label of the option the user has chosen for this question',
  })
  chosenOptionLabel: string;
}
