import { plainToInstance } from 'class-transformer';
import { NonEmptyString } from '../../../libs/data-types';
import {
  ClientCompositeIdentifier,
  ClientCompositeIdentifierValuedProp,
} from '../client.composite-identifier';

export class ClientFlaggedPayload {
  @ClientCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: ClientCompositeIdentifier;

  @NonEmptyString({
    label: 'flag ID',
    description: 'identifies the flag that was raised for this client',
  })
  flagId: string;
}

export class ClientFlagged {
  readonly type = 'CLIENT_FLAGGED';

  readonly payload: ClientFlaggedPayload;

  constructor({ payload }: { payload: ClientFlaggedPayload }) {
    this.payload = plainToInstance(ClientFlaggedPayload, payload);
  }

  static fromPersistenceDto(dto: ClientFlagged) {
    return new ClientFlagged(dto);
  }
}
