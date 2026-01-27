import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import { InMemoryClientCommandRepository } from './repositories';
import { ClientQueryService } from './services/client-query.service';

@Module({
  imports: [],
  providers: [
    ClientQueryService,
    {
      provide: CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useClass: InMemoryClientCommandRepository,
    },
  ],
  controllers: [ClientController],
})
export class ClientModule {}
