import { plainToInstance } from 'class-transformer';
import { NonEmptyString } from '../../../../libs/data-types';
import {
  ClientCompositeIdentifier,
  ClientCompositeIdentifierValuedProp,
} from '../../client.composite-identifier';

export class CommunityAffiliationAddedForClientPayload {
  @ClientCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: ClientCompositeIdentifier;

  @NonEmptyString({
    label: 'community ID',
    description: `identifies the client's community`,
  })
  communityId: string;
}

export class CommunityAffiliationAddedForClient {
  readonly type = 'COMMUNITY_AFFILIATION_ADDED_FOR_CLIENT';

  readonly payload: CommunityAffiliationAddedForClientPayload;

  constructor({
    payload,
  }: {
    payload: CommunityAffiliationAddedForClientPayload;
  }) {
    this.payload = plainToInstance(
      CommunityAffiliationAddedForClientPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: CommunityAffiliationAddedForClient) {
    return new CommunityAffiliationAddedForClient(dto);
  }
}
