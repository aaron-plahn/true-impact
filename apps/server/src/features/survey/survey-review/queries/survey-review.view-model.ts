import { NonEmptyString } from '../../../../libs/data-types';
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

  isComplete: boolean;

  size: number;
}

export class SurveyReviewViewModel {
  id: string;

  revision: string;

  questions: SurveyQuestionReviewRecordViewModel[] = [];

  surveyName: string;

  surveyParticipantLabel: string;

  constructor({
    id,
    revision,
    questions,
    surveyName,
    surveyParticipantLabel,
  }: {
    id: string;
    revision: string;
    questions?: SurveyQuestionReviewRecordViewModel[];
    surveyName: string;
    surveyParticipantLabel: string;
  }) {
    this.id = id;

    this.revision = revision;

    this.surveyName = surveyName;

    this.surveyParticipantLabel = surveyParticipantLabel;

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
      surveyName: this.surveyName,
      surveyParticipantLabel: this.surveyParticipantLabel,
      questions: this.questions.map((q) => q.toClientDto()),
      isComplete,
      size,
    };
  }

  static fromDomainModel(domainModel: SurveyReview) {
    return new SurveyReviewViewModel({
      id: domainModel.getId(),
      revision: domainModel.revision.toString(),
      surveyName: domainModel.surveyName,
      // TODO handle this
      surveyParticipantLabel: 'REDACTED',
      questions: domainModel.questionsReviewed.map((qr) =>
        SurveyQuestionReviewRecordViewModel.fromDomainModel(qr),
      ),
    });
  }
}
