import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../../common/multilingual-text';
import {
  BooleanDataType,
  NestedDataType,
  NonEmptyString,
} from '../../../../libs/data-types';
import { SurveyQuestionReviewRecord } from '../survey-question-review-record.entity';

export class SurveyQuestionReviewRecordViewModelClientDto {
  @NonEmptyString({
    label: 'label',
    description: 'label of the question under review',
  })
  label: string;

  @NonEmptyString({
    label: 'chosen option',
    description: 'label of the option chosen by the survey participant',
  })
  chosenOptionLabel: string;

  @BooleanDataType({
    label: 'has been viewed',
    description: `Has the response to this question been reviewed?`,
  })
  hasBeenViewed: boolean;

  @NestedDataType(() => MultilingualTextPersistenceDto, {
    label: 'notes',
    description:
      'a list of notes that revieweres have made about this particular response',
  })
  notes: MultilingualTextPersistenceDto[];
}

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
    return {
      label: this.label,
      chosenOptionLabel: this.chosenOptionLabel,
      hasBeenViewed: this.hasBeenViewed,
      notes: this.notes.map((n) => n.toPersistenceDto()),
    };
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
