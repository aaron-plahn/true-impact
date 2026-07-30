import { Pool } from 'pg';
import { ConfigService, Global, Module } from '../libs/framework';

export const PG_POOL_INJECTION_TOKEN = 'PG_POOL';

// DATABASE_URL="postgresql://postgres:secret_password@localhost:5432/my_database?schema=public"

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL_INJECTION_TOKEN,
      useFactory: (configService: ConfigService) => {
        // TODO implement validator for config service so we can fail fast if vars are invalid \ missing
        // TODO `$POSTGRES_HOST`
        const connectionString = `postgresql://${configService.get('POSTGRES_USER')}:${configService.get('POSTGRES_PASSWORD')}@localhost:${configService.get('POSTGRES_PORT')}/${configService.get('POSTGRES_DB')}?schema=public`;

        return new Pool({
          connectionString,
          max: 20, // Max concurrent connections
          idleTimeoutMillis: 30000, // 30 s
        });
      },
    },
  ],
  exports: [PG_POOL_INJECTION_TOKEN],
})
export class PostgresModule {}
