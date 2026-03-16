import { NestedDataType, NonEmptyString } from '../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../survey-completion';

export class AddNoteAboutQuestionResponse {
  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NonEmptyString({
    label: 'review ID',
    description:
      'uniquely identifies the review being updated amongst other reviews of this survey attempt',
  })
  reviewId: string;

  @NonEmptyString({
    label: 'question label',
    description: `Which question's response would you like to make a note about?`,
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'note',
    description: `note anything you find worth remarking on regarding this question's response`,
  })
  note: string;

  @NonEmptyString({
    label: 'language code',
    description: 'In which language are you making this note?',
  })
  languageCode: string;
}
