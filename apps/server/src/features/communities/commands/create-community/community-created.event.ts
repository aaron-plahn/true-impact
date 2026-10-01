import { plainToInstance } from 'class-transformer';
import { MultilingualTextItemEventRecord } from '../../../../features/flags/commands';
import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  CommunityCompositeIdentifier,
  CommunityCompositeIdentifierValuedProp,
} from '../../models';

export class CommunityCreatedPayload {
  @CommunityCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: CommunityCompositeIdentifier;

  @NonEmptyString({
    label: 'band number',
    description:
      'text representation of the government-assigned unique ID number for this community',
    mustBeUnique: true,
  })
  bandNumber: string;

  // in the future, we will support naming the community in the Indigenous language first, for now, this will alwasy be `English (en)`
  @NestedDataType(() => MultilingualTextItemEventRecord, {
    label: 'name',
    description: `the community's name (and language thereof)`,
  })
  name: MultilingualTextItemEventRecord;

  // TODO Track which nation communities are part of
  // @NonEmptyString({
  //   label: 'nation',
  //   description: 'the broader nation that this community is part of',
  // })
  // nation: string;
}

@TrueImpactDataExample<CommunityCreated>({
  example: {
    type: 'COMMUNITY_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'community',
        id: '1',
      },
      bandNumber: '321',
      name: {
        text: 'The People of the River',
        languageCode: 'en',
        translationType: 'original',
      },
    },
  },
})
export class CommunityCreated {
  readonly type = 'COMMUNITY_CREATED';

  readonly payload: CommunityCreatedPayload;

  constructor({ payload }: { payload: CommunityCreatedPayload }) {
    this.payload = plainToInstance(CommunityCreatedPayload, payload);
  }

  static fromPersistenceDto(dto: CommunityCreated) {
    return new CommunityCreated(dto);
  }
}
