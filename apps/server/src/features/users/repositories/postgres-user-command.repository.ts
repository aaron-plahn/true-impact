import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DomainEvent, PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import {
  DeepPartial,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import { EventFactory } from '../../../postgresql/event-factory';
import {
  EventDocument,
  thinMap,
} from '../../../postgresql/postgres-event.repository';
import { PG_POOL_INJECTION_TOKEN } from '../../../postgresql/postgres.module';
import { User } from '../user.aggregate-root';
import { USER_AGGREGATE_TYPE } from '../user.composite-identifier';
import { IUserCommandRepository } from './user-command-repository.interface';

/**
 * TODO We can have a transaction that spans multiple function calls. We should
 * consider the performance tradeoff against using this approach to reuse logic
 * from the `PosgresEventRepository` here, keeping in mind that performance is less
 * critical for test relevant methods.
 */
export class PostgresUserCommandRepository implements IUserCommandRepository {
  constructor(
    @Inject(PG_POOL_INJECTION_TOKEN)
    private readonly pool: Pool,
    private readonly eventFactory: EventFactory,
    private readonly configService: ConfigService,
  ) {}

  async fetchById(id: string): Promise<User | null> {
    // TODO Can we not just use the existing event repository implementation here?
    const selectUserEvents = `
        SELECT e 
        FROM events e
        WHERE (e.payload->>'type') = '${USER_AGGREGATE_TYPE}'
        AND (e.payload->>'id') = $1;
        `;

    const bindVars = [id];

    const eventQueryResult = await this.pool
      .query<EventDocument>(selectUserEvents, bindVars)
      .catch((e) => {
        throw e;
      });

    // TODO be sure to test that inactive users cannot log in
    const eventsForThisUser = eventQueryResult.rows.map((row) => {
      const plainEvent = this.eventFactory.build(thinMap(row));

      const { metadata } = row;

      // TODO SSOT for this
      const eventWithMetadata = Object.assign(plainEvent, {
        metadata,
        revision: row.revision,
        streamId: row.stream_id,
      });

      return eventWithMetadata;
    });

    const result = User.fromEventHistory(eventsForThisUser);

    if (result instanceof Error) {
      throw new Error(
        `Failed to fetch user [${id}] due to invalid existing data in the database.`,
      );
    }

    return result;
  }

  /**
   * In the long run, we will want to use the view layer
   * for list views.
   */
  fetchMany(): Promise<User[] | TrueImpactError> {
    throw new Error('Method not implemented.');
  }

  async create(
    instance: User,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const events = instance.eventHistory;

    if (events.length === 0) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(`You cannot persist an empty list of events.`),
      ]);
    }

    const firstEvent = events[0];

    const streamId = `${firstEvent.payload.aggregateCompositeIdentifier.type}/${firstEvent.payload.aggregateCompositeIdentifier.id}`;

    if (
      !events.every(
        ({
          payload: {
            aggregateCompositeIdentifier: {
              type: aggregateType,
              id: aggregateId,
            },
          },
        }) =>
          aggregateType ===
            firstEvent.payload.aggregateCompositeIdentifier.type &&
          aggregateId === firstEvent.payload.aggregateCompositeIdentifier.id,
      )
    ) {
      return new TrueImpactError(
        `Invalid request. The Postgres Event Repository only supports appending to one stream. It is meant to support transactional writes inside one aggregate boundary at a time.`,
      );
    }

    const client = await this.pool.connect().catch((postgresError: Error) => {
      return new TrueImpactError(`Failed to connect to the database`, [
        new TrueImpactError(postgresError.message),
      ]);
    });

    if (client instanceof Error) {
      return client;
    }

    try {
      await client.query('BEGIN');

      /**
       * Note that externally the client credentials are persisted in Supertoken's database. Supertokens
       * is only responsible for managing credentials and authentication. Our `UserCommandRepository` is always
       * the single source of truth for the User's state (roles, permissions, identity).
       */

      const insertIntoEvents = `
        INSERT INTO events (stream_id, event_type, payload, metadata, revision)
        SELECT 
          unpacked.streamId,
          unpacked.type,
          unpacked.payload,
          unpacked.metadata,
          unpacked.revision
        FROM jsonb_to_recordset($1::jsonb) AS unpacked(streamId text, type text, payload jsonb, metadata jsonb, revision int )
        ON CONFLICT (stream_id, revision) DO NOTHING
        RETURNING *;
      `;

      if (!streamId) {
        throw new Error(`Invalid stream ID! [null]`);
      }

      const jsonEventsPayload = JSON.stringify(
        instance.eventHistory.map(({ type, payload }, index) => ({
          streamId: `${payload.aggregateCompositeIdentifier.type}/${payload.aggregateCompositeIdentifier.id}`,
          type,
          payload,
          // TODO where do we append the metadata?
          metadata: {},
          revision: index + 1, // offset the 0th new event by 1 from the revision number at fetch time
        })),
      );

      await client.query(insertIntoEvents, [jsonEventsPayload]);

      const result = await client.query('COMMIT').catch((e: Error) => {
        return new TrueImpactError(e.message);
      });

      if (result instanceof Error) {
        return result;
      }

      if (result.rowCount === 0) {
        return new TrueImpactError(
          `Optimistic concurrency error. Failed to create user [${instance.id}]. Someone else has created a conflicting user since the request was initiated.`,
        );
      }

      return {
        type: USER_AGGREGATE_TYPE,
        id: instance.id,
        revision: instance.eventHistory.length.toString(),
      };
    } catch (pgError) {
      await client.query('ROLLBACK').catch((rollbackException) => {
        throw rollbackException;
      });

      return new TrueImpactError(
        `Concurrency error encountered when creating user [${instance.id}].`,
        [new TrueImpactError((pgError as Error).message)],
      );
    } finally {
      client.release();
    }
  }

  // Do we need this for tests?
  createMany(_instances: User[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async update(
    instance: DeepPartial<User> & Pick<User, 'id'>,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { revision = 0, eventHistory: incomingEventHistory = [] } = instance;

    // The type of the incoming instance is a bit off here. This might not be a good abstraction.
    const eventHistory = incomingEventHistory as DomainEvent[];

    if (eventHistory.length === 0) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          // we don't want to expose the name in logs
          `Failed to persist updated due to missing event history for user [${instance.id}]`,
        ),
      ]);
    }

    // TODO make this the domain's responsibility
    const recentEvents = eventHistory.filter((_event, index) => {
      const eventSequenceNumber = index + 1;

      return eventSequenceNumber > revision;
    });

    // recentEvents.forEach((recentEvent) => {
    //   Object.assign(recentEvent, {
    //     // TODO metadata
    //   });
    // });

    if (recentEvents.length === 0) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(`You cannot persist an empty list of events.`),
      ]);
    }

    const firstEvent = recentEvents[0];

    const streamId = `${firstEvent.payload.aggregateCompositeIdentifier.type}/${firstEvent.payload.aggregateCompositeIdentifier.id}`;

    if (!streamId) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to update event history for user [${instance.id}] due to missing streamId`,
        ),
      ]);
    }

    if (
      !recentEvents.every(
        ({
          payload: {
            aggregateCompositeIdentifier: {
              type: aggregateType,
              id: aggregateId,
            },
          },
        }) =>
          aggregateType ===
            firstEvent.payload.aggregateCompositeIdentifier.type &&
          aggregateId === firstEvent.payload.aggregateCompositeIdentifier.id,
      )
    ) {
      return new TrueImpactError(
        `Invalid request. The Postgres Event Repository only supports appending to one stream. It is meant to support transactional writes inside one aggregate boundary at a time.`,
      );
    }

    // TODO we don't need a transaction here because we are no longer writing to a second credentials table
    const query = `
        BEGIN;

        INSERT INTO events (stream_id, event_type, payload, metadata, revision)
        SELECT 
          unpacked.streamId,
          unpacked.type,
          unpacked.payload,
          unpacked.metadata,
          unpacked.revision
        FROM jsonb_to_recordset($4::jsonb) AS unpacked(streamId text, type text, payload jsonb, metadata jsonb, revision int )
        ON CONFLICT (stream_id, revision) DO NOTHING
        RETURNING *;

        COMMIT;
    `;

    const client = await this.pool.connect().catch((postgresError: Error) => {
      return new TrueImpactError(`Failed to connect to the database`, [
        new TrueImpactError(postgresError.message),
      ]);
    });

    if (client instanceof Error) {
      return client;
    }

    const jsonEventsPayload = JSON.stringify(
      recentEvents.map(({ type, payload }, index) => {
        if (!streamId) {
          throw new Error(`what in the world?????????????????`);
        }

        return {
          streamId,
          type,
          payload,
          // TODO deal with this
          metadata: {},
          revision: revision + index + 1, // offset the 0th new event by 1 from the revision number at fetch time
        };
      }),
    );

    const result = await client
      .query(query, [
        (instance.revision || 0) + recentEvents.length,
        instance.isActive || false,
        instance.id,
        jsonEventsPayload,
      ])
      .catch((e: Error) => {
        return new TrueImpactError(`Database query failed in Postgres.`, [
          new TrueImpactError(e.message),
        ]);
      });

    client.release();

    if (result instanceof Error) {
      return result;
    }

    if (result.rowCount === 0) {
      return new TrueImpactError(
        `Failed to persist update to event stream: [${streamId}]. Somone else has written data since revision [${revision}]`,
      );
    }

    return {
      type: USER_AGGREGATE_TYPE,
      id: instance.id,
      revision: (revision + recentEvents.length).toString(),
    };
  }

  async isEmpty(): Promise<boolean> {
    const query = `
        SELECT COUNT(*)::int as count
        FROM EVENTS
        WHERE (payload->>'type') = '${USER_AGGREGATE_TYPE}';
    `;

    const queryResult = await this.pool
      .query<{ count: number }>(query, [])
      .catch((e) => {
        throw e;
      });

    return queryResult.rows[0].count === 0;
  }

  async clear() {
    if (!['test', 'e2e'].includes(process.env.NODE_ENV || '**NEVER**')) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot clear surveys in the non-test environment [${process.env.NODE_ENV}]`,
        ),
      ]);
    }

    const query = `
        DELETE FROM events
        WHERE (payload.aggregateCompositeIdentifier->>id) != v_user_id
        OR (payload.aggregateCompositeIdentifier->>type) != '${USER_AGGREGATE_TYPE}'
    `;

    await this.pool
      .query(query, [this.configService.get<string>('SYSTEM_ADMIN_USERNAME')])
      .catch((e) => {
        throw e;
      });
  }
}
