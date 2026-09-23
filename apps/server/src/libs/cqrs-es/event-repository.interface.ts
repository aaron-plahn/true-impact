export interface EventDto {
  type: string;
  streamId: string;
  payload: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export interface EventPayload {
  aggregateCompositeIdentifier: {
    type: string;
    id: string;
  };
}

/**
 * This is a contract related to persistence of events. As such, it includes the `metadata`.
 */
export interface DomainEvent<T extends EventPayload = EventPayload> {
  type: string;
  payload: T;
}

/**
 * Do we want the streamId and revision to be at the top level here?
 * The thin mapping layer can always pull them out of the metadata for
 * easier indexing in the persistence model.
 *
 * We may want the revision to be appended by the database to ensure consistency.
 * In that case, uncommitted events will be missing a revision number.
 */
export type WithEventMetadata<
  T extends DomainEvent,
  U = Record<string, unknown>,
> = T & {
  metadata: U;
  revision: number;
  streamId: string;
};

export interface IEventRepository {
  appendAt(
    revision: number,
    ...events: DomainEvent[]
    // necessary for optimistic concurrency
  ): Promise<{ streamId: string } | Error>;

  read(aggregateCompositeIdentifier?: {
    type: string;
    id: string;
  }): Promise<DomainEvent[]>;
}
