import { NonEmptyString } from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

export class RemoveQuestionFromSurvey {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'label of question to remove',
    description: 'the label of the question to remove from this survey',
    isArray: false,
    isOptional: false,
  })
  label: string;
}
