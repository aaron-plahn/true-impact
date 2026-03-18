import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../../common/multilingual-text';
import { FlagViewModelClientDto } from '../../../../features/flags/queries';
import {
  BooleanDataType,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
} from '../../../../libs/data-types';
import { SURVEY_REVIEW_AGGREGATE_TYPE } from '../constants';
import { SurveyReview } from '../survey-review.aggregate-root';
import {
  SurveyQuestionReviewRecordViewModel,
  SurveyQuestionReviewRecordViewModelClientDto,
} from './survey-question-review-record.view-model';

export class SurveyReviewViewModelClientDto {
  static readonly type = SURVEY_REVIEW_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'uniquely identifies this review amongst all survey reviews',
  })
  id: string;

  @NonEmptyString({
    label: 'revision',
    description:
      'indicates the current version of this review across all historical edits',
  })
  revision: string;

  // @LookupTable
  questions: SurveyQuestionReviewRecordViewModelClientDto[];

  @NonEmptyString({
    label: 'survey name',
    description: 'the name of the survey whose attempt is under review',
  })
  surveyName: string;

  @NonEmptyString({
    label: 'survey participant label',
    description:
      'a name or ID for the participant who completed the survey under review',
  })
  surveyParticipantLabel: string;

  @NestedDataType(() => MultilingualTextPersistenceDto, {
    label: 'general notes',
    description:
      'a list of notes that pertain to the overall participant response, not a single question in particular',
    isArray: true,
  })
  generalNotes: MultilingualTextPersistenceDto[];

  @BooleanDataType({
    label: 'has been submitted',
    description: 'Has this review been officially submitted by the reviewer?',
  })
  hasBeenSubmitted: boolean;

  /**
   * The following are calculated fields.
   */
  @BooleanDataType({
    label: 'is complete',
    description: 'Has every question been marked as viewed?',
  })
  isComplete: boolean;

  @NonNegativeInteger({
    label: 'size',
    description: 'the number of questions that have been marked as viewed',
  })
  numberOfQuestionsViewed: number;
}

export class SurveyReviewViewModel {
  id: string;

  revision: string;

  hasBeenSubmitted: boolean;

  questions: SurveyQuestionReviewRecordViewModel[] = [];

  surveyName: string;

  surveyParticipantLabel: string;

  generalNotes: MultilingualText[];

  constructor({
    id,
    revision,
    hasBeenSubmitted,
    questions,
    surveyName,
    surveyParticipantLabel,
    generalNotes,
  }: {
    id: string;
    revision: string;
    hasBeenSubmitted: boolean;
    questions?: SurveyQuestionReviewRecordViewModel[];
    surveyName: string;
    surveyParticipantLabel: string;
    generalNotes?: MultilingualText[];
  }) {
    this.id = id;

    this.revision = revision;

    this.hasBeenSubmitted = hasBeenSubmitted;

    this.surveyName = surveyName;

    this.surveyParticipantLabel = surveyParticipantLabel;

    if (Array.isArray(generalNotes)) {
      this.generalNotes = generalNotes;
    }

    if (questions) {
      this.questions = questions;
    }
  }

  toClientDto(): SurveyReviewViewModelClientDto {
    const size = this.questions.filter((q) => q.hasBeenViewed).length;

    const isComplete = size === this.questions.length;

    return {
      id: this.id,
      revision: this.revision,
      hasBeenSubmitted: this.hasBeenSubmitted,
      surveyName: this.surveyName,
      surveyParticipantLabel: this.surveyParticipantLabel,
      questions: this.questions.map((q) => q.toClientDto()),
      isComplete,
      numberOfQuestionsViewed: size,
      generalNotes: this.generalNotes.map((n) => n.toPersistenceDto()),
    };
  }

  static fromDomainModel(
    domainModel: SurveyReview,
    context: { flags: Map<string, FlagViewModelClientDto> },
  ): SurveyReviewViewModel {
    return new SurveyReviewViewModel({
      id: domainModel.getId(),
      revision: domainModel.revision.toString(),
      hasBeenSubmitted: domainModel.hasBeenSubmitted,
      surveyName: domainModel.surveyName,
      // TODO handle this
      surveyParticipantLabel: 'REDACTED',
      questions: domainModel.questionsReviewed.map((qr) =>
        SurveyQuestionReviewRecordViewModel.fromDomainModel(qr, context),
      ),
      generalNotes: domainModel.generalNotes,
    });
  }
}
