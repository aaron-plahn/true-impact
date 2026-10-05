import { plainToInstance } from 'class-transformer';
import { MultilingualTextItemEventRecord } from 'src/features/flags/commands';
import { NestedDataType } from 'src/libs/data-types';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class NoteAboutQuestionResponseAddedPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  questionLabel: string;

  @NestedDataType(() => MultilingualTextItemEventRecord, {
    label: 'note',
    description: `a clinician's note about a client's response to a question in the given survey`,
  })
  note: MultilingualTextItemEventRecord;
}

export class NoteAboutQuestionResponseAdded {
  readonly type = 'NOTE_ABOUT_QUESTION_RESPONSE_ADDED';

  readonly payload: NoteAboutQuestionResponseAddedPayload;

  constructor({ payload }: { payload: NoteAboutQuestionResponseAddedPayload }) {
    this.payload = plainToInstance(
      NoteAboutQuestionResponseAddedPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: NoteAboutQuestionResponseAdded) {
    return new NoteAboutQuestionResponseAdded(dto);
  }
}
