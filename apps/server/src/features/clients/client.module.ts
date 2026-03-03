import { CommandHandlerService } from 'src/libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { ClientController } from './client.controller';
import { CreateClient } from './commands/create-client.command';
import { CreateClientCommandHandler } from './commands/create-client.command-handler';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import { InMemoryClientCommandRepository } from './repositories';
import { ClientValidationService } from './services';
import { ClientQueryService } from './services/client-query.service';

@Module({
  imports: [],
  providers: [
    ClientQueryService,
    CreateClientCommandHandler,
    {
      provide: CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useClass: InMemoryClientCommandRepository,
    },
    {
      provide: CommandHandlerService,
      useFactory: (moduleRef: ModuleRef) => {
        const commandHandlerService = new CommandHandlerService({
          resolve(injectionToken) {
            return moduleRef.get(injectionToken);
          },
        });

        commandHandlerService.register({
          CommandPayloadCtor: CreateClient,
          CommandHandlerCtor: CreateClientCommandHandler,
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
