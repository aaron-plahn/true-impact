import { MultilingualText } from '../../../common/multilingual-text';
import {
  AggregateRoot,
  Entity,
  NestedDataType,
  TrueImpactError,
} from '../../../libs/data-types';
import { SurveyResponseRecord } from '../survey-completion';
import { SurveyParticipantCompositeIdentifier } from '../survey-completion/models';
import { SURVEY_REVIEW_AGGREGATE_TYPE } from './constants';
import {
  SurveyQuestionReviewRecord,
  SurveyQuestionReviewRecordPersistenceDto,
} from './survey-question-review-record.entity';

class SurveyReviewPersistenceDto {
  id: string;
  revision: number;
  questionsReviewed: SurveyQuestionReviewRecordPersistenceDto[];
  surveyName: string;
  surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
}

export class SurveyReview extends AggregateRoot<SurveyReviewPersistenceDto> {
  static readonly type = SURVEY_REVIEW_AGGREGATE_TYPE;

  id: string;

  revision: number;

  surveyName: string;

  surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;

  // @lookup table
  questionsReviewed: SurveyQuestionReviewRecord[];

  @NestedDataType(() => MultilingualText, {
    label: 'notes',
    description: `A list of general notes about this participant's response to this survey in general.`,
  })
  notes: MultilingualText[] = [];

  constructor({
    id,
    revision,
    questionsReviewed,
    surveyName,
    surveyParticipantCompositeIdentifier,
  }: {
    id: string;
    revision: number;
    questionsReviewed: SurveyQuestionReviewRecord[];
    surveyName: string;
    surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
  }) {
    super();

    this.id = id;

    this.revision = revision;

    this.questionsReviewed = questionsReviewed;

    this.surveyName = surveyName;

    this.surveyParticipantCompositeIdentifier =
      surveyParticipantCompositeIdentifier;
  }

  toPersistenceDto(): SurveyReviewPersistenceDto {
    return {
      id: this.id,
      revision: this.revision,
      questionsReviewed: this.questionsReviewed.map((qr) =>
        qr.toPersistenceDto(),
      ),
      surveyName: this.surveyName,
      surveyParticipantCompositeIdentifier:
        this.surveyParticipantCompositeIdentifier,
    };
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    throw new Error('Method not implemented.');
  }

  static fromUserRequest({
    surveyResponseRecord,
  }: {
    surveyResponseRecord: SurveyResponseRecord;
  }) {
    const questions = surveyResponseRecord.responses.map(
      (responseForQuestion) =>
        SurveyQuestionReviewRecord.buildEmptyFromResponse(responseForQuestion),
    );

    const surveyName = surveyResponseRecord.survey.name;

    return new SurveyReview({
      id: undefined as unknown as string,
      revision: 0,
      questionsReviewed: questions,
      surveyName,
      surveyParticipantCompositeIdentifier: surveyResponseRecord.participant,
    });
  }

  static fromPersistenceDto(
    dto: SurveyReviewPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): Entity | TrueImpactError {
    const questionsReviewed = dto.questionsReviewed.map((qr) =>
      SurveyQuestionReviewRecord.fromPersistenceDto(qr, buildOptions),
    );

    const questionBuildErrors = questionsReviewed.filter(
      (qr): qr is TrueImpactError => qr instanceof TrueImpactError,
    );

    if (questionBuildErrors.length > 0) {
      return new TrueImpactError(
        `Failed to build survey review due to one or more invalid questions`,
        questionBuildErrors,
      );
    }

    return new SurveyReview({
      id: dto.id,
      revision: dto.revision,
      questionsReviewed: questionsReviewed as SurveyQuestionReviewRecord[],
      surveyName: dto.surveyName,
      surveyParticipantCompositeIdentifier:
        dto.surveyParticipantCompositeIdentifier,
    });
  }
}
