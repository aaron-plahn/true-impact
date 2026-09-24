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
  readonly type = 'OPTION_ADDED_TO_SURVEY_QUESTION';

  readonly payload: OpenSurveyToAnonymousIndividualPayload;

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
