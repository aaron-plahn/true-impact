import { NotImplementedException } from '@nestjs/common';
import { Pool } from 'pg';
import { TrueImpactError } from '../libs/data-types';
import { Inject } from '../libs/framework';
import { EventFactory } from './event-factory';
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
    private readonly eventFactory: EventFactory,
  ) {}

  async appendEvent(
    event: BaseEvent,
    // necessary for optimistic concurrency
    revision: number,
  ): Promise<{ streamId: string } | Error> {
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

    const client = await this.pool.connect().catch((e: Error) => {
      return new TrueImpactError(`Failed to connect to the database`, [
        new TrueImpactError(e.message),
      ]);
    });

    if (client instanceof Error) {
      return client;
    }

    const result = await client.query(query, values).catch((e: Error) => {
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
     * It is the feature module's responsibility to register event factory functions
     * per event type introduced in said module.
     */
    const eventInstances = rawRows.rows.map((row) =>
      this.eventFactory.build(thinMap(row)),
    );

    return eventInstances;
  }
}
