import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';

@TrueImpactDataExample<CreateCommunity>({
  example: {
    bandNumber: '777',
    name: 'Community A',
    languageCodeForName: 'en',
    nation: 'Nation X',
  },
})
export class CreateCommunity {
  static readonly type = 'CREATE_COMMUNITY';

  @NonEmptyString({
    label: 'band number',
    description:
      'text representation of the government-assigned unique ID number for this community',
    mustBeUnique: true,
  })
  bandNumber: string;

  // this must be unique
  @NonEmptyString({
    label: 'name',
    description: 'the name of the community',
  })
  name: string;

  @NonEmptyString({
    label: 'language code for community name',
    description: 'specifies the language in which you are naming the community',
  })
  languageCodeForName: string; // in the future, we will support naming the community in the Indigenous language first

  // TODO Validate this from either the DB or an enum in a tenant config
  @NonEmptyString({
    label: 'nation',
    description: 'the broader nation that this community is part of',
  })
  nation: string;
}
