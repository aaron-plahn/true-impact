import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../libs/data-types';

export class PostgresTestHelper {
  constructor(
    configService: ConfigService,
    private readonly pool: Pool,
  ) {
    const NODE_ENV = configService.get<string>('NODE_ENV') || '';

    if (NODE_ENV !== 'test' && NODE_ENV !== 'e2e') {
      /**
       * This is one of multiple layers of protections against this
       * being used in production.
       */
      throw new Error(
        `You cannot use the Postgres Test Helper in a non-test environment [${NODE_ENV}]`,
      );
    }
  }

  async clear(tableName: string): Promise<void> {
    // TODO can we check that the databsase name includes `test`?

    if (tableName !== 'events') {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot drop unknown table [${tableName}] as part of test setup.`,
        ),
      ]);
    }

    // TODO should we use truncate instead?
    await this.pool
      .query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`)
      .catch((e) => {
        throw e;
      });
    // const dropTableIfExists = `
    //   DROP TABLE IF EXISTS ${tableName};
    //   `;

    // look into client vs. pool
    // await this.pool.query(dropTableIfExists).catch((e) => {
    //   throw e;
    // });
  }
}
