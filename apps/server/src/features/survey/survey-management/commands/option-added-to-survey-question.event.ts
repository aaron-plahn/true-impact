import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

// TODO Decorate all event payload classes
export class OpenSurveyToAnonymousIndividualPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  questionLabel: string;
  optionLabel: string;
  text: string;
}

export class OptionAddedToSurveyQuestion {
  // TODO be consisten with command type formats
  readonly type = 'FOLLOW-UP_QUESTION_ADDED_FOR_SURVEY';

  payload: OpenSurveyToAnonymousIndividualPayload;

  constructor({
    payload,
  }: {
    payload: OpenSurveyToAnonymousIndividualPayload;
  }) {
    this.payload = plainToInstance(
      OpenSurveyToAnonymousIndividualPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: OptionAddedToSurveyQuestion) {
    return new OptionAddedToSurveyQuestion(dto);
  }
}
