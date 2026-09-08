import { Client, Pool } from 'pg';
import {
  BaseEvent,
  EventDocument,
  IEventFactory,
  PostgresEventRepository,
} from './postgres-event.repository';

const POSTGRES_HOST = 'localhost';
const POSTGRES_PORT = 5432;
const POSTGRES_USER = process.env.POSTGRES_USER;
// TODO env var
// DO THIS
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_DB = 'testpostgreseventrepository';

if (!POSTGRES_DB) {
  throw new Error(`missing var`);
}

const POSTGRES_CONNECTION_STRING = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

const testDatabaseName = POSTGRES_DB;

type ToyEventMeta = {
  userId: string;
  dateEffective: string;
};

const WIDGET = 'WIDGET';

class WidgetCreated {
  streamId: string;

  readonly type = 'WIDGET_CREATED';

  readonly payload: {
    aggregateCompositeIdentifier: { type: string; id: string };
    name: string;
  };

  readonly meta: ToyEventMeta;

  revision: number;

  constructor(doc: {
    streamId: string;
    type: 'WIDGET_CREATED';
    payload: {
      aggregateCompositeIdentifier: { id: string };
      name: string;
    };
    meta: ToyEventMeta;
  }) {
    Object.assign(this, doc);
  }
}

const firstWidgetCreated: WidgetCreated = {
  streamId: 'widget123',
  revision: 0,
  type: 'WIDGET_CREATED',
  payload: {
    aggregateCompositeIdentifier: {
      type: WIDGET,
      id: '1',
    },
    name: 'First Born Widget!',
  },
  meta: {
    userId: '123',
    dateEffective: '1234567',
  },
};

const eventFactory: IEventFactory = {
  build<T extends BaseEvent = BaseEvent>(eventDocument: EventDocument): T {
    if (eventDocument.event_type === 'WIDGET_CREATED') {
      return new WidgetCreated(
        eventDocument as unknown as WidgetCreated,
      ) as unknown as T;
    }

    throw new Error(`Unknown event type: ${eventDocument.event_type}`);
  },
};

describe(`PostgresEventRepository`, () => {
  const pool = new Pool({
    connectionString: POSTGRES_CONNECTION_STRING,
    max: 20, // Max concurrent connections
    idleTimeoutMillis: 30000, // 30 s
  });

  let testRepository: PostgresEventRepository;

  beforeAll(async () => {
    const adminClient = new Client({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: 'postgres',
      connectionTimeoutMillis: 1500,
    });

    await adminClient.connect();

    const dbsWithNameQuery = `SELECT 1 from pg_catalog.pg_database WHERE datname = $1`;

    const res = await adminClient
      .query(dbsWithNameQuery, [testDatabaseName])
      .catch(async (e) => {
        await adminClient.end();

        throw e;
      });

    if (res.rowCount === 0) {
      // the database does not yet exist
      // Note that CREATE DATABASE cannot be run in a parametrized query. It is important that the user is never able to inject the database name
      // TODO can we sanitize \ validate the name just as an extra safe guard?
      await adminClient.query(`CREATE DATABASE "${testDatabaseName}"`);
    }

    await adminClient.end();

    // is this used?
    const client = new Client({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: testDatabaseName,
      connectionTimeoutMillis: 1500,
    });

    try {
      await client.connect();

      testRepository = new PostgresEventRepository(pool, eventFactory);

      // stream_id, event_type, payload, metadata
      // TODO test setup helper
      // This would be terrible in production!

      // TODO should we use truncate instead?
      // Resets the table data instantly without deleting the table structure
      // await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');

      const dropTableIfExists = `
      DROP TABLE IF EXISTS events;
      `;

      await client.query(dropTableIfExists).catch((e) => {
        throw e;
      });

      // TODO use a lib to get static analysis \ type safety on SQL queries
      // not null constraints?
      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS events (
        stream_id TEXT PRIMARY KEY,
        revision INT NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        CONSTRAINT uq_stream_version UNIQUE (stream_id, revision)
        );
      `;

      await client.query(createTableQuery).catch((e) => {
        throw e;
      });

      await client.end();

      console.log('done');
      // todo after all ``client.end()
    } catch (error) {
      await client.end();

      throw new Error(`${error}`);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe(`when creating a first event`, () => {
    it(`should persist the event`, async () => {
      await testRepository.appendEvent(firstWidgetCreated, 0);

      const searchResult = await testRepository.read();

      expect(searchResult).toHaveLength(1);

      const foundRecord = searchResult[0];

      expect(foundRecord).toBeInstanceOf(WidgetCreated);

      // TODO Check that all props are persisted properly
    });
  });
});
