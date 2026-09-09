import { DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { Client, Pool } from 'pg';
import { ConfigService, Global, Module, ModuleRef } from '../libs/framework';
import { EventFactory } from './event-factory';
import { PostgresEventRepository } from './postgres-event.repository';
import { PostgresTestHelper } from './postgres-test-helper';

export const PG_POOL_INJECTION_TOKEN = 'PG_POOL';

// DATABASE_URL="postgresql://postgres:secret_password@localhost:5432/my_database?schema=public"

@Global()
// Is this necessary if we expose a factory function?
@Module({})
// onModuleDestroy close pool?
export class PostgresModule implements OnModuleDestroy {
  constructor(private readonly moduleRef: ModuleRef) {}

  // TODO set up and test connection string and pool
  static forRootAsync(): DynamicModule {
    const poolProvider = {
      provide: PG_POOL_INJECTION_TOKEN,
      useFactory: async (configService: ConfigService) => {
        // TODO build the connection string in the config service
        const POSTGRES_HOST = configService.get<string>('POSTGRES_HOST');

        // TODO parse int in the config service
        const POSTGRES_PORT = configService.get<string>('POSTGRES_PORT');

        const port = Number.parseInt(POSTGRES_PORT || '');

        const POSTGRES_USER = configService.get<string>('POSTGRES_USER');

        const POSTGRES_PASSWORD =
          configService.get<string>('POSTGRES_PASSWORD');

        // TODO commandDB, queryDB
        const POSTGRES_DB = configService.get<string>('POSTGRES_DB');

        const POSTGRES_CONNECTION_STRING = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

        console.log({ POSTGRES_CONNECTION_STRING });

        const adminClient = new Client({
          host: POSTGRES_HOST,
          port,
          user: POSTGRES_USER,
          password: POSTGRES_PASSWORD,
          database: 'postgres',
          connectionTimeoutMillis: 1500,
        });

        // Create DB if not exists
        await adminClient.connect();

        const dbsWithNameQuery = `SELECT 1 from pg_catalog.pg_database WHERE datname = $1`;

        const res = await adminClient
          .query(dbsWithNameQuery, [POSTGRES_DB])
          .catch(async (e) => {
            await adminClient.end();

            throw e;
          });

        if (res.rowCount === 0) {
          // the database does not yet exist
          // Note that CREATE DATABASE cannot be run in a parametrized query. It is important that the user is never able to inject the database name
          // TODO can we sanitize \ validate the name just as an extra safe guard?
          await adminClient.query(`CREATE DATABASE "${POSTGRES_DB}"`);
        }

        await adminClient.end();

        // Create tables if not exist
        const client = new Client({
          host: POSTGRES_HOST,
          port,
          user: POSTGRES_USER,
          password: POSTGRES_PASSWORD,
          database: POSTGRES_DB,
          connectionTimeoutMillis: 1500,
        });

        await client.connect().catch((e) => {
          // TODO supplement this error with internal information ("failed to connect to PostgreSQL check your configuration or netowrk")
          throw e;
        });

        // TODO use a lib to get static analysis \ type safety on SQL queries
        // not null constraints?
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS events (
        stream_id TEXT,
        revision INT NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        meta JSONB DEFAULT '{}'::jsonb,
        CONSTRAINT uq_stream_version UNIQUE (stream_id, revision)
        );
      `;

        await client.query(createTableQuery).catch((e) => {
          throw e;
        });

        await client.end();

        const pool = new Pool({
          connectionString: POSTGRES_CONNECTION_STRING,
          max: 20, // Max concurrent connections
          idleTimeoutMillis: 30000, // 30 s
        });

        return pool;
      },
      inject: [ConfigService],
    };

    // const exports: ModuleMetadata['exports'] = [
    //   EventFactory,
    //   // TODO double check that circular deps checks are running
    //   // TODO const
    //   'EVENT_REPOSITORY_INJECTION_TOKEN',
    // ];

    // if (['test', 'e2e'].includes(process.env.NODE_ENV || '**NEVER**')) {
    //   /**
    //    * This is yet another safeguard against this being used in production.
    //    */
    //   exports.push(PostgresTestHelper);
    // }

    const shouldIncludeTestHelper = ['test', 'e2e'].includes(
      process.env.NODE_ENV || '**NEVER**',
    );

    console.log({
      shouldIncludeTestHelper,
    });

    const postgresTestHelperProvider = {
      provide: PostgresTestHelper,
      useFactory: (configService: ConfigService, pool: Pool) => {
        return new PostgresTestHelper(configService, pool);
      },
      inject: [ConfigService, PG_POOL_INJECTION_TOKEN],
    };

    return {
      module: PostgresModule,
      imports: [],
      providers: [
        poolProvider,
        /**
         * We provide and export a singleton event factory so that clients can dynamically
         * register their individual event factory functions for use in the event repository.
         */
        EventFactory,
        {
          provide: 'EVENT_REPOSITORY_INJECTION_TOKEN',
          useFactory: (pool: Pool, eventFactory: EventFactory) => {
            return new PostgresEventRepository(pool, eventFactory);
          },
          inject: [PG_POOL_INJECTION_TOKEN, EventFactory],
        },
        ...(shouldIncludeTestHelper ? [postgresTestHelperProvider] : []),
      ],
      exports: [
        EventFactory,
        // TODO double check that circular deps checks are running
        // TODO const
        'EVENT_REPOSITORY_INJECTION_TOKEN',
        ...(shouldIncludeTestHelper ? [postgresTestHelperProvider] : []),
      ],
    };
  }

  async onModuleDestroy() {
    // avoid memory leaks
    await this.moduleRef
      .get<Pool>(PG_POOL_INJECTION_TOKEN)
      .end()
      .catch((e) => {
        throw e;
      });
  }
}
