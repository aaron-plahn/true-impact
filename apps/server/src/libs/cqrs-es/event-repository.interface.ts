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

export interface BaseEvent<T extends EventPayload = EventPayload> {
  type: string;
  streamId: string;
  payload: T;
  // TODO metadata!
  meta: Record<string, unknown>;
  revision: number;
}

export interface IEventRepository {
  appendAt(
    revision: number,
    ...events: BaseEvent[]
    // necessary for optimistic concurrency
  ): Promise<{ streamId: string } | Error>;

  read(aggregateCompositeIdentifier?: {
    type: string;
    id: string;
  }): Promise<BaseEvent[]>;
}
