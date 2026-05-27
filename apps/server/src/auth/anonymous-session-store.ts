import { ConfigService } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';

export class AnonymousSessionStore {
  private readonly pool: Pool;

  constructor(configService: ConfigService) {
    const user = configService.get<string>('POSTGRES_USER') as string;

    const password = configService.get<string>('POSTGRES_PASSWORD') as string;

    // TODO ensure this is parsed to an int
    const port = configService.get<number>('POSTGRES_PORT') as number;

    const poolOptions: PoolConfig = {
      user,
      password,
      database: 'anonymous_survey_sessions',
      port,
    };

    this.pool = new Pool(poolOptions);
  }

  // TODO find a better pattern
  getPool() {
    return this.pool;
  }
}
