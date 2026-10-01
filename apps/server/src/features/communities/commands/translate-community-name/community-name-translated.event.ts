import { plainToInstance } from 'class-transformer';
import { MultilingualTextItemEventRecord } from '../../../../features/flags/commands';
import {
  NestedDataType,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  CommunityCompositeIdentifier,
  CommunityCompositeIdentifierValuedProp,
} from '../../models/community.composite-identifier';

export class CommunityNameTranslatedPayload {
  @CommunityCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: CommunityCompositeIdentifier;

  @NestedDataType(() => MultilingualTextItemEventRecord, {
    label: 'translation record',
    description:
      'text and language information for the translation of the community name',
  })
  translation: MultilingualTextItemEventRecord;
}

@TrueImpactDataExample<CommunityNameTranslated>({
  example: {
    type: 'COMMUNITY_NAME_TRANSLATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'community',
        id: '11',
      },
      translation: {
        text: 'Yellow Rock',
        languageCode: 'en',
        translationType: 'free translation',
      },
    },
  },
})
export class CommunityNameTranslated {
  readonly type = 'COMMUNITY_NAME_TRANSLATED';

  readonly payload: CommunityNameTranslatedPayload;

  constructor({ payload }: { payload: CommunityNameTranslatedPayload }) {
    this.payload = plainToInstance(CommunityNameTranslatedPayload, payload);
  }

  static fromPersistenceDto(dto: CommunityNameTranslated) {
    return new CommunityNameTranslated(dto);
  }
}
