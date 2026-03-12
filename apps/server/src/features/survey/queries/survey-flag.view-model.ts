import { Flag } from '../../../features/flags/models';
import { NonEmptyString } from '../../../libs/data-types';

export class SurveyFlagViewModelClientDto {
  @NonEmptyString({
    label: 'ID',
    description: 'system identifier for this flag',
  })
  id: string;

  @NonEmptyString({
    label: 'label',
    description: 'a unique label for this flag',
    mustBeUnique: true,
  })
  label: string;

  @NonEmptyString({
    label: 'description',
    description: 'a longer summary of the significance of this flag',
  })
  description: string;
}

export class SurveyFlagViewModel {
  id: string;

  label: string;

  description: string;

  constructor({
    id,
    label,
    description,
  }: {
    id: string;
    label: string;
    description: string;
  }) {
    this.id = id;

    this.label = label;

    this.description = description;
  }

  toClientDto(): SurveyFlagViewModelClientDto {
    return {
      id: this.id,
      label: this.label,
      description: this.description,
    };
  }

  static fromDomainModel({ id, label, description }: Flag) {
    return new SurveyFlagViewModel({
      id: id as string,
      label,
      description,
    });
  }
}
