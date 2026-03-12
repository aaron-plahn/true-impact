import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import { Community } from '../models';

export class CommunityViewModelClientDto {
  id: string;

  bandNumber: string;

  revision: string;

  nation: string;

  name: MultilingualTextPersistenceDto; // TODO do we want a separate Client DTO for this?
}

export class CommunityViewModel {
  id: string;

  bandNumber: string;

  revision: string;

  name: MultilingualText;

  nation: string;

  constructor({
    id,
    bandNumber,
    revision,
    name,
    nation,
  }: {
    id: string;
    bandNumber: string;
    revision: string;
    name: MultilingualText;
    nation: string;
  }) {
    this.id = id;

    this.bandNumber = bandNumber;

    this.revision = revision;

    this.name = name;

    this.nation = nation;
  }

  toClientDto(): CommunityViewModelClientDto {
    return {
      id: this.id,
      bandNumber: this.bandNumber,
      revision: this.revision,
      name: this.name.toPersistenceDto(),
      nation: this.nation,
    };
  }

  static fromDomainModel({
    id,
    bandNumber,
    revision,
    name,
    nation,
  }: Community) {
    return new CommunityViewModel({
      // this will never be undefined by the point it is reaches the view layer because it will have been persisted (and an ID generated) at least once in the domain
      id: id as string,
      bandNumber,
      revision: revision.toString(),
      name: name,
      nation,
    });
  }
}
