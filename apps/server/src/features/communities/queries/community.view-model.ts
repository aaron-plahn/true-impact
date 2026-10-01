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

  constructor({
    id,
    bandNumber,
    revision,
    name,
  }: {
    id: string;
    bandNumber: string;
    revision: string;
    name: MultilingualText;
  }) {
    this.id = id;

    this.bandNumber = bandNumber;

    this.revision = revision;

    this.name = name;
  }

  toClientDto(): CommunityViewModelClientDto {
    return {
      id: this.id,
      bandNumber: this.bandNumber,
      revision: this.revision,
      name: this.name.toPersistenceDto(),
    };
  }

  static fromDomainModel({ id, bandNumber, revision, name }: Community) {
    return new CommunityViewModel({
      // this will never be undefined by the point it is reaches the view layer because it will have been persisted (and an ID generated) at least once in the domain
      id: id as string,
      bandNumber,
      revision: revision.toString(),
      name: name,
    });
  }
}
