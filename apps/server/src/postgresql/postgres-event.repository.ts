import { NotImplementedException } from '@nestjs/common';
import { Pool } from 'pg';
import { Inject } from '../libs/framework';
import { PG_POOL_INJECTION_TOKEN } from './postgres.module';

export interface EventDocument {
  event_type: string;
  stream_id: string;
  payload: Record<string, unknown>;
  meta: Record<string, unknown>;
}

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
  meta: Record<string, unknown>;
  revision: number;
}

export interface IEventFactory {
  /**
   * It is always the case that the client knows which event type will be based according to the
   * type discriminant. We **do not** want to manage giant lookup tables correlating event type string literals
   * with TS types of corresponding events. This is tough to maintain and can cause circularities. Cast at the call site.
   */
  build<T extends BaseEvent = BaseEvent>(eventDocument: EventDto): T;
}

const thinMap = (row: EventDocument): EventDto => {
  const streamId = row.stream_id;
  const type = row.event_type;

  Object.assign(row, { streamId, type });

  // @ts-expect-error We modify this in-place to avoid cloning unnecessarily.
  delete row.stream_id;

  // @ts-expect-error We modify this in-place to avoid cloning unnecessarily.
  delete row.event_type;

  return row as unknown as EventDto;
};

export class PostgresEventRepository {
  constructor(
    @Inject(PG_POOL_INJECTION_TOKEN)
    private readonly pool: Pool,
    @Inject('EVENT_FACTORY_INJECTION_TOKEN')
    private readonly eventFactory: IEventFactory,
  ) {}

  // couldn't this potentially return an error?
  /**
   * TODO Is it possible to have a constraint that crosess stream boundaries?
   * The idea would be that we project off n streams and then report the streams we used
   * when committing and fail an optimistic concurrency check if any of those streams has been edited.
   */
  async appendEvent(
    event: BaseEvent,
    // necessary for optimistic concurrency
    revision: number,
  ): Promise<{ streamId: string } | Error> {
    // is this necessary? wouldn't this introduce performance issues? We are running one atomic write.
    await this.pool.query('BEGIN TRANSACTION;');

    // stream_version?
    const query = `
        INSERT INTO events (stream_id, event_type, payload, meta, revision)
        VALUES ($1, $2, $3, $4, $5 + 1)
        ON CONFLICT (stream_id, revision) DO NOTHING;
    `;

    const values = [
      event.streamId,
      event.type,
      event.payload,
      event.meta,
      revision,
    ];

    const result = await this.pool.query(query, values).catch((_e) => {
      // do this
      throw new Error(`TODO MAke this a returned error`);
    });

    if (result.rowCount === 0) {
      return new Error(
        `Failed to persist update to event stream: [${event.streamId}]. Somone else has written data since revision [${revision}]`,
      );
    }

    await this.pool.query('COMMIT TRANSACTION;');

    return {
      streamId: event.streamId,
    };
  }

  /**
   * We want our stream IDs to be of form `${type}/${id}`.
   */
  async read(_aggregateCompositeIdentifier?: {
    type: string;
    id: string;
  }): Promise<BaseEvent[]> {
    if (_aggregateCompositeIdentifier) {
      throw new NotImplementedException(`Event filters are not yet supported`);
    }

    const selectAllEvents = `SELECT * FROM events`;

    const rawRows = await this.pool
      .query<EventDocument>(selectAllEvents)
      .catch((e) => {
        // TODO return errors
        throw e;
      });

    /**
     * It is the repository's responsibility to hydrate an instance of an event. This means that we need an `EventFactory`.
     * The event factory can be built by dynamically registering events `@DomainEvent` and using a plugin style architecture.
     * ```ts
     * myEventFactory.register("MY_EVENT",()=> MyEvent.fromDocument(eventDoc))
     *
     * We should be careful around the design of this. If it's possible to avoid running discovery up front, that might be ideal.
     * We could consider injecting the factory into the read method instead of the constructor. We could consider injecting a way to lazily lookup the meta for
     * the factory when needed instead of eagerly building the entire factory. There are lots of things to think about here.
     * ```
     */
    const eventInstances = rawRows.rows.map((row) =>
      this.eventFactory.build(thinMap(row)),
    );

    return eventInstances;
  }
}
