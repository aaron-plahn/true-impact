import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { FLAG_AGGREGATE_TYPE } from '../constants';
import { Flag } from '../models';

@TrueImpactDataExample<FlagViewModelClientDto>({
  example: {
    id: '1',
    revision: '2',
    label: 'dangerous',
    description: 'this indicates that the client may be a threat to others',
  },
})
export class FlagViewModelClientDto {
  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for this flag',
  })
  id: string;

  @NonEmptyString({
    label: 'revision',
    description: 'tracks historical versions of this flag across edits',
  })
  revision: string;

  @NonEmptyString({
    label: 'label',
    description: 'short user-facing text that summarizes this label',
  })
  label: string;

  @NonEmptyString({
    label: 'description',
    description:
      'a longer description of the purpose of this flag to ensure consistent use',
  })
  description: string;
}

export class FlagViewModel {
  static readonly type = FLAG_AGGREGATE_TYPE;

  id: string;
  revision: string;
  label: string;
  description: string;

  constructor({
    id,
    revision,
    label,
    description,
  }: {
    id: string;
    revision: string;
    label: string;
    description: string;
  }) {
    this.id = id;

    this.revision = revision;

    this.label = label;

    this.description = description;
  }

  toClientDto(): FlagViewModelClientDto {
    return {
      id: this.id,
      revision: this.revision,
      label: this.label,
      description: this.description,
    };
  }

  static fromDomainModel({ id, revision, label, description }: Flag) {
    return new FlagViewModel({
      id: id as string,
      // domain models track sequential revision numbers, but we present them as strings
      revision: revision.toString(),
      label,
      description,
    });
  }
}
