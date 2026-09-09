import { OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService, Global, Module, ModuleRef } from '../libs/framework';
import { EventFactory } from './event-factory';
import {
  IEventFactory,
  PostgresEventRepository,
} from './postgres-event.repository';

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
    {
      provide: 'EVENT_FACTORY',
      useClass: EventFactory,
    },
    {
      provide: 'EVENT_REPOSITORY',
      /**
       * There's a problem here. The domain module requires the persistence module. But the persistence module needs an
       * event factory from the domain module. We should look at registration \ dependency injection patterns in ORMs in NestJS
       * to get this right.
       */
      // Do we still need an interface here if the event factory is concrete on this side?
      useFactory: (pool: Pool, eventFactory: IEventFactory) => {
        const repo = new PostgresEventRepository(pool, eventFactory);

        return repo;
      },
      inject: [PG_POOL_INJECTION_TOKEN, 'EVENT_FACTORY'],
    },
  ],
  /**
   * Clients must register their event builders in this event factory.
   * This avoids circular dependencies by which a domain module needs
   * the postgres module, but the postgres module needs the domain module
   * to get the event factory.
   **/
  exports: ['EVENT_FACTORY'],
})
// onModuleDestroy close pool?
export class PostgresModule implements OnModuleDestroy {
  constructor(private readonly moduleRef: ModuleRef) {}

  // TODO set up and test connection string and pool
  // async forRootAsync(): DynamicModule{

  // }

  async onModuleDestroy() {
    // avoid memory leaks
    await this.moduleRef.get<Pool>(PG_POOL_INJECTION_TOKEN).end();
  }
}
