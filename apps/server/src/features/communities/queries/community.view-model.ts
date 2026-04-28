import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { Community } from '../models';

@TrueImpactDataExample<CommunityViewModelClientDto>({
  example: {
    id: '1',
    bandNumber: '777',
    revision: '5',
    nation: 'Tha People',
    name: {
      items: {
        en: {
          original: {
            text: 'Great Big Band',
          },
        },
      },
    },
  },
})
export class CommunityViewModelClientDto {
  @NonEmptyString({
    label: 'ID',
    description:
      'unique system ID for this community (distinct from the band number)',
  })
  id: string;

  @NonEmptyString({
    label: 'band #',
    description: `the unique government-assigned band number for this community`,
  })
  bandNumber: string;

  @NonEmptyString({
    label: 'revision',
    description: 'tracks historical edits to this community',
  })
  revision: string;

  @NonEmptyString({
    label: 'nation',
    description: 'the larger nation to which this community belongs',
  })
  nation: string;

  @NestedDataType(() => MultilingualTextPersistenceDto, {
    label: 'name',
    description: 'name of this community, including any available translations',
  })
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
