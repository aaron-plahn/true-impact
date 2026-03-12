import { InMemoryCommandRepository } from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { FlagModule } from '../flags/flag.module';
import { Client } from './client.aggregate-root';
import { ClientController } from './client.controller';
import { CreateClient } from './commands/create-client.command';
import { CreateClientCommandHandler } from './commands/create-client.command-handler';
import { FlagClient } from './commands/flag-client.command';
import { FlagClientCommandHandler } from './commands/flag-client.command-handler';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import { ClientValidationService } from './services';
import { ClientQueryService } from './services/client-query.service';

@Module({
  imports: [FlagModule],
  providers: [
    ClientQueryService,
    // Commands
    CreateClientCommandHandler,
    FlagClientCommandHandler,
    {
      provide: CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryCommandRepository(Client),
    },
    {
      provide: CommandHandlerService,
      useFactory: (moduleRef: ModuleRef) => {
        const commandHandlerService = new CommandHandlerService({
          resolve(injectionToken) {
            return moduleRef.get(injectionToken);
          },
        });

        commandHandlerService
          .register({
            CommandPayloadCtor: CreateClient,
            CommandHandlerCtor: CreateClientCommandHandler,
          })
          .register({
            CommandHandlerCtor: FlagClientCommandHandler,
            CommandPayloadCtor: FlagClient,
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
