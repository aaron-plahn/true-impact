import { plainToInstance } from 'class-transformer';
import { ClientCompositeIdentifier } from '../client.composite-identifier';

interface EventRecordMetadata {
  dateCreated: number;
  userId: string;
  schemaVersion: string;
}

export class ClientCreatedPayload {
  aggregateCompositeIdentifier: ClientCompositeIdentifier;

  fullName: string; // FullName

  dateOfBirth: number; // Date?

  isIndigenous?: 'Yes' | 'No' | 'Unknown';

  communityId: string;
}

export const CLIENT_CREATED = 'CLIENT_CREATED';

export class ClientCreated {
  readonly type = CLIENT_CREATED;

  readonly payload: ClientCreatedPayload;

  readonly metadata: EventRecordMetadata;

  constructor({
    payload,
    metadata,
  }: {
    payload: ClientCreatedPayload;
    metadata: EventRecordMetadata;
  }) {
    this.payload = plainToInstance(ClientCreatedPayload, payload);

    this.metadata = metadata;

    // TODO We should validate the schema before persisting.
  }

  /**
   * Use this factory method to build an event record from a persisted document (after applying the thin mapping layer)
   */
  public static fromPersistenceDto({
    payload,
    metadata,
  }: {
    payload: ClientCreatedPayload;
    metadata: EventRecordMetadata;
  }) {
    return new ClientCreated({ payload, metadata });
  }
}
