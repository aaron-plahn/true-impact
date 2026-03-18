import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../../common/multilingual-text';
import { FlagViewModelClientDto } from '../../../../features/flags/queries';
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

  // TODO lookup table
  flagsById: Record<string, FlagViewModelClientDto>;
}

export class SurveyQuestionReviewRecordViewModel {
  label: string;
  chosenOptionLabel: string;
  hasBeenViewed: boolean;
  notes: MultilingualText[];
  flagsById = new Map<string, FlagViewModelClientDto>();

  constructor({
    label,
    chosenOptionLabel,
    hasBeenViewed,
    notes,
    flagsById: flags,
  }: {
    label: string;
    chosenOptionLabel: string;
    hasBeenViewed: boolean;
    notes: MultilingualText[];
    flagsById: Map<string, FlagViewModelClientDto>;
  }) {
    this.label = label;

    this.chosenOptionLabel = chosenOptionLabel;

    this.hasBeenViewed = hasBeenViewed;

    this.notes = notes;

    flags.forEach((flag, flagId) => {
      this.flagsById.set(flagId, flag);
    });
  }

  toClientDto(): SurveyQuestionReviewRecordViewModelClientDto {
    const flagsById: Record<string, FlagViewModelClientDto> = {};

    this.flagsById.forEach((flag, flagId) => {
      flagsById[flagId] = flag;
    });

    return {
      label: this.label,
      chosenOptionLabel: this.chosenOptionLabel,
      hasBeenViewed: this.hasBeenViewed,
      notes: this.notes.map((n) => n.toPersistenceDto()),
      flagsById,
    };
  }

  static fromDomainModel(
    domainModel: SurveyQuestionReviewRecord,
    context: { flags: Map<string, FlagViewModelClientDto> },
  ) {
    const flagsById = new Map<string, FlagViewModelClientDto>();

    const {
      label: questionLabel,
      chosenOptionLabel: optionLabel,
      hasBeenViewed,
      notes,
    } = domainModel;

    domainModel.flagIds.forEach((flagId) => {
      if (context.flags.has(flagId)) {
        flagsById.set(
          flagId,
          context.flags.get(flagId) as FlagViewModelClientDto,
        );
      }
    });

    return new SurveyQuestionReviewRecordViewModel({
      label: questionLabel,
      chosenOptionLabel: optionLabel,
      hasBeenViewed,
      notes,
      flagsById,
    });
  }
}
