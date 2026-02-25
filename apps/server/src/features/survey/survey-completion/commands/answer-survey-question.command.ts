import { SurveyResponseCompositeIdentifier } from '../survey-response-record.aggregate-root';

export class AnswerSurveyQuestion {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  questionLabel: string;

  chosenOptionLabel: string;
}
