import { InMemoryCommandRepository } from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { CommunityModule } from '../communities/community.module';
import { FlagModule } from '../flags/flag.module';
import { Client } from './client.aggregate-root';
import { ClientController } from './client.controller';
import { AddCommunityAffiliationForClient } from './commands/add-community-affiliation-for-client';
import { AddCommunityAffiliationForClientCommandHandler } from './commands/add-community-affiliation-for-client.command-handler';
import { CreateClient } from './commands/create-client.command';
import { CreateClientCommandHandler } from './commands/create-client.command-handler';
import { FlagClient } from './commands/flag-client.command';
import { FlagClientCommandHandler } from './commands/flag-client.command-handler';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import { ClientValidationService } from './services';
import { ClientQueryService } from './services/client-query.service';

@Module({
  imports: [FlagModule, CommunityModule],
  providers: [
    ClientQueryService,
    // Commands
    CreateClientCommandHandler,
    FlagClientCommandHandler,
    AddCommunityAffiliationForClientCommandHandler,
    {
      provide: CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryCommandRepository(Client),
    },
    {
      provide: CommandHandlerService,
      useFactory: (moduleRef: ModuleRef) => {
        const commandHandlerService = new CommandHandlerService(
          {
            resolve(injectionToken) {
              return moduleRef.get(injectionToken);
            },
          },
          // TODO Should this be a generic events gateway or a client events gateway?
          { publishEvent: (_e) => {} },
        );

        commandHandlerService
          .register({
            CommandPayloadCtor: CreateClient,
            CommandHandlerCtor: CreateClientCommandHandler,
          })
          .register({
            CommandHandlerCtor: FlagClientCommandHandler,
            CommandPayloadCtor: FlagClient,
          })
          .register({
            CommandHandlerCtor: AddCommunityAffiliationForClientCommandHandler,
            CommandPayloadCtor: AddCommunityAffiliationForClient,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
    ClientValidationService,
  ],
  exports: [ClientValidationService],
  controllers: [ClientController],
})
export class ClientModule {}
