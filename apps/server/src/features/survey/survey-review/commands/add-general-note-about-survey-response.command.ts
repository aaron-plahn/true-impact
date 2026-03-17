import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyReviewCompositeIdentifier } from '../survey-review.composite-identifier';

@TrueImpactDataExample<AddGeneralNoteAboutSurveyResponse>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey review',
      id: '1',
    },
    reviewId: '2',
    note: 'this is the new note',
    languageCode: 'en',
  },
})
export class AddGeneralNoteAboutSurveyResponse {
  static readonly type = 'ADD_GENERAL_NOTE_ABOUT_SURVEY_RESPONSE';

  @NestedDataType(() => SurveyReviewCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'review ID',
    description:
      'uniquely identifies this review amongst other reviews of the same survey attempt',
  })
  reviewId: string;

  @NonEmptyString({
    label: 'note',
    description: `Note anything you find worth commenting on regarding this participant's survey response in general.`,
  })
  note: string;

  @NonEmptyString({
    label: 'language code',
    description: 'In which language are you making the note?',
  })
  languageCode: string;
}
