import { Client, Pool } from 'pg';
import { PostgresEventRepository } from './postgres-event.repository';

const POSTGRES_HOST = 'localhost';
const POSTGRES_PORT = 5432;
const POSTGRES_USER = process.env.POSTGRES_USER;
// TODO env var
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_DB = process.env.POSTGRES_DB;

const POSTGRES_CONNECTION_STRING = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

const testDatabaseName = 'postgres-event-repository-test';

type ToyEventMeta = {
  userId: string;
  dateEffective: string;
};

const WIDGET = 'WIDGET';

class WidgetCreated {
  readonly type = 'WIDGET_CREATED';

  readonly payload: {
    aggregateCompositeIdentifier: { type: string; id: string };
    name: string;
  };

  readonly meta: ToyEventMeta;
}

const firstWidgetCreated: WidgetCreated = {
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

describe(`PostgresEventRepository`, () => {
  const pool = new Pool({
    connectionString: POSTGRES_CONNECTION_STRING,
    max: 20, // Max concurrent connections
    idleTimeoutMillis: 30000, // 30 s
  });

  let testRepository: PostgresEventRepository;

  beforeAll(async () => {

    const client = new Client({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: 'testdb',
      connectionTimeoutMillis: 1500,
    });

    try {
      await client.connect();

      console.log('searching 1');
      const databaseSearchResult = await client.query(
        `SELECT * FROM employees`,
      );
      console.log({ databaseSearchResult });
      console.log('done 2');
      if (databaseSearchResult.rowCount === 0) {
        console.log('more queries 3');
        // Should we use bind params here? We own the db name so there's not risk of an injection attack. Is that even possible with database names?
        await client.query(`CREATE DATABASE $${testDatabaseName};`);
      }

      testRepository = new PostgresEventRepository(pool);

      await client.end();
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
      await testRepository.appendEvent(firstWidgetCreated);

      const searchResult = await testRepository.read({ type: WIDGET, id: '1' });

      expect(searchResult).toHaveLength(1);

      // TODO Check that all props are persisted properly
    });
  });
});
