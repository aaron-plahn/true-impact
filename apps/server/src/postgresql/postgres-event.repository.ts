import { Pool } from 'pg';
import { Inject } from '../libs/framework';
import { PG_POOL_INJECTION_TOKEN } from './postgres.module';

interface IEvent {
  type: string;
  payload: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export class PostgresEventRepository {
  constructor(
    @Inject(PG_POOL_INJECTION_TOKEN)
    private readonly pool: Pool,
  ) {}

  // couldn't this potentially return an error?
  /**
   * TODO Is it possible to have a constraint that crosess stream boundaries?
   * The idea would be that we project off n streams and then report the streams we used
   * when committing and fail an optimistic concurrency check if any of those streams has been edited.
   */
  async appendEvent(_event: IEvent): Promise<{ streamId: string } | Error> {
    // stream_version?
    const query = `
        INSERT INTO events (stream_id, event_type, payload, metadata)
        VALUES ( $1, $2, $3, $4)
        ON CONFLICT (stream_id) DO NOTHING;
    `;

    const values = [];

    const result = await this.pool.query(query, values);

    if (result.rowCount === 0) {
      return new Error(
        `Postgres query failed.\n Concurrency conflict: Stream: event.streamId`,
      );
    }

    return {
      streamId: '123',
    };
  }

  /**
   * We want our stream IDs to be of form `${type}/${id}`.
   */
  async read(_aggregateCompositeIdentifier?: {
    type: string;
    id: string;
  }): Promise<IEvent[]> {
    return Promise.resolve([]);
  }
}
