import { plainToInstance } from 'class-transformer';
import { MultilingualTextItemEventRecord } from 'src/features/flags/commands';
import { NestedDataType } from 'src/libs/data-types';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class GeneralNoteAboutSurveyResponseAddedPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NestedDataType(() => MultilingualTextItemEventRecord, {
    label: 'note',
    description: `a clinician's note about the client's response to an survey in general (considering responses to all questions together)`,
  })
  note: MultilingualTextItemEventRecord;
}

export class GeneralNoteAboutSurveyResponseAdded {
  readonly type = 'GENERAL_NOTE_ABOUT_SURVEY_RESPONSE_ADDED';

  readonly payload: GeneralNoteAboutSurveyResponseAddedPayload;

  constructor({
    payload,
  }: {
    payload: GeneralNoteAboutSurveyResponseAddedPayload;
  }) {
    this.payload = plainToInstance(
      GeneralNoteAboutSurveyResponseAddedPayload,
      payload,
    );
  }

  private fromPersistenceDto(dto: GeneralNoteAboutSurveyResponseAdded) {
    return new GeneralNoteAboutSurveyResponseAdded(dto);
  }
}
