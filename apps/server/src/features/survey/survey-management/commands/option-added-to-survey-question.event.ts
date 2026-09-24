import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

// TODO Decorate all event payload classes
export class OpenSurveyToAnonymousIndividualPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  questionLabel: string;
  optionLabel: string;
  text: string;
}

@TrueImpactDataExample<OptionAddedToSurveyQuestion>({
  example: {
    type: 'OPTION_ADDED_TO_SURVEY_QUESTION',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '44',
      },
      questionLabel: '1',
      optionLabel: 'a',
      text: 'first test option',
    },
  },
})
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
