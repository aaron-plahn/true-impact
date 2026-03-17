import { MultilingualText } from '../../../../common/multilingual-text';
import { SurveyQuestionReviewRecord } from '../survey-question-review-record.entity';

export class SurveyQuestionReviewRecordViewModelClientDto {}

export class SurveyQuestionReviewRecordViewModel {
  label: string;
  chosenOptionLabel: string;
  hasBeenViewed: boolean;
  notes: MultilingualText[];

  constructor({
    label,
    chosenOptionLabel,
    hasBeenViewed,
    notes,
  }: {
    label: string;
    chosenOptionLabel: string;
    hasBeenViewed: boolean;
    notes: MultilingualText[];
  }) {
    this.label = label;

    this.chosenOptionLabel = chosenOptionLabel;

    this.hasBeenViewed = hasBeenViewed;

    this.notes = notes;
  }

  toClientDto(): SurveyQuestionReviewRecordViewModelClientDto {
    return {};
  }

  static fromDomainModel({
    questionLabel,
    optionLabel,
    hasBeenViewed,
    notes,
  }: SurveyQuestionReviewRecord) {
    return new SurveyQuestionReviewRecordViewModel({
      label: questionLabel,
      chosenOptionLabel: optionLabel,
      hasBeenViewed,
      notes,
    });
  }
}
