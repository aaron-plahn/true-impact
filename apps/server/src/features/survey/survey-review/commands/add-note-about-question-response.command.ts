import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyReviewCompositeIdentifier } from '../survey-review.composite-identifier';

@TrueImpactDataExample<AddNoteAboutQuestionResponse>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey review',
      id: '1',
    },
    reviewId: '2',
    questionLabel: 'V',
    note: 'I wonder if they really meant this.',
    languageCode: 'en',
  },
})
export class AddNoteAboutQuestionResponse {
  static readonly type = 'ADD_NOTE_ABOUT_QUESTION_RESPONSE';

  @NestedDataType(() => SurveyReviewCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

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
