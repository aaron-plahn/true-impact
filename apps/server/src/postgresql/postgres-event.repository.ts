import { Pool } from 'pg';
import {
  DomainEvent,
  EventDto,
  IEventRepository,
  WithEventMetadata,
} from '../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../libs/data-types';
import { Inject } from '../libs/framework';
import { EventFactory } from './event-factory';
import { PG_POOL_INJECTION_TOKEN } from './postgres.module';

export interface EventDocument {
  event_type: string;
  stream_id: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  revision: number;
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

export class PostgresEventRepository implements IEventRepository {
  constructor(
    @Inject(PG_POOL_INJECTION_TOKEN)
    private readonly pool: Pool,
    // TODO - CONSTANT
    @Inject('EVENT_FACTORY_INJECTION_TOKEN')
    private readonly eventFactory: EventFactory,
  ) {}

  async appendAt(
    revision: number,
    event: WithEventMetadata<DomainEvent>,
    // necessary for optimistic concurrency
  ): Promise<{ streamId: string } | Error> {
    /**
     * There is a possible data anomale in this design. The `stream_id` must be the same for all events with the same `payload.aggergateCompositeIdentifier.type` and `...id`.
     */
    const query = `
        INSERT INTO events (stream_id, event_type, payload, metadata, revision)
        VALUES ($1, $2, $3, $4, $5 + 1)
        ON CONFLICT (stream_id, revision) DO NOTHING;
    `;

    const values = [
      event.streamId,
      event.type,
      event.payload,
      event.metadata,
      revision,
    ];

    const client = await this.pool.connect().catch((postgresError: Error) => {
      return new TrueImpactError(`Failed to connect to the database`, [
        new TrueImpactError(postgresError.message),
      ]);
    });

    if (client instanceof Error) {
      return client;
    }

    const result = await client.query(query, values).catch((e: Error) => {
      console.warn({ invalidEvent: event });

      return new TrueImpactError(`Database query failed in Postgres.`, [
        new TrueImpactError(e.message),
      ]);
    });

    if (result instanceof Error) {
      return result;
    }

    client.release();

    if (result.rowCount === 0) {
      return new Error(
        `Failed to persist update to event stream: [${event.streamId}]. Somone else has written data since revision [${revision}]`,
      );
    }

    return {
      streamId: event.streamId,
    };
  }

  /**
   * We may want our stream IDs to be of form `${type}/${id}`.
   *
   * We need to normalize the relationship between streamID and aggregateCompositeIdentifier
   *
   * We may want to include an offset revision
   */
  async read(aggregateCompositeIdentifier?: {
    type?: string;
    id?: string;
  }): Promise<WithEventMetadata<DomainEvent>[]> {
    const hasSearchFilters =
      typeof (
        aggregateCompositeIdentifier?.type || aggregateCompositeIdentifier?.id
      ) !== 'undefined';

    // The `pg` driver safely serializes the object. Note that users can't choose IDs or types, so there isn't much risk to being with here.
    const selectAllEvents = `
    SELECT * FROM events
    ${hasSearchFilters ? 'WHERE payload @> $1' : ''};
    `;

    const bindVars = hasSearchFilters
      ? [
          {
            aggregateCompositeIdentifier,
          },
        ]
      : [];

    const rawRows = await this.pool
      .query<EventDocument>(selectAllEvents, bindVars)
      .catch((e) => {
        // TODO return errors
        throw e;
      });

    /**
     * It is the feature module's responsibility to register event factory functions
     * per event type introduced in said module.
     */
    const eventInstances = rawRows.rows.map((row) => {
      const plainEvent = this.eventFactory.build(thinMap(row));

      const { metadata } = row;

      const eventWithMetadata = Object.assign(plainEvent, {
        metadata,
        revision: row.revision,
        streamId: row.stream_id,
      });

      return eventWithMetadata;
    });

    return eventInstances;
  }

  /**
   * TODO We need to design a way to clear test data that is external to our persistence layer implementation
   * for better confidence that this could never happen outside of a test environment.
   */
  async clear() {
    if (!['test', 'e2e'].includes(process.env.NODE_ENV || '**never**')) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You can't clear an event store outside of a test environment.`,
        ),
      ]);
    }

    const truncateQuery = `
      TRUNCATE TABLE events RESTART IDENTITY;
    `;

    await this.pool.query(truncateQuery);
  }
}
