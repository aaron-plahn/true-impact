import { FLAG_AGGREGATE_TYPE } from '../constants';
import { Flag } from '../models';

export class FlagViewModelClientDto {
  id: string;

  revision: string;

  label: string;

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
