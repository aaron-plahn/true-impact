import {
  InMemoryCommandRepository,
  InMemoryQueryRepository,
} from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { CreateFlag, RelabelFlag, RelabelFlagCommandHandler } from './commands';
import { CreateFlagCommandHandler } from './commands/create-flag.command-handler';
import {
  FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
  FLAG_QUERY_REPOSITORY_DEPENDENCY_TOKEN,
  FLAG_VALIDATION_SERVICE_INJECTION_TOKEN,
} from './constants';
import { FlagValidationService } from './external-services/flag-validation.service';
import { FlagController } from './flag.controller';
import { Flag } from './models';
import { FlagQueryService, FlagViewModel } from './queries';

@Module({
  providers: [
    FlagQueryService,
    // commands
    CreateFlagCommandHandler,
    RelabelFlagCommandHandler,
    {
      provide: FLAG_QUERY_REPOSITORY_DEPENDENCY_TOKEN,
      useFactory: () => new InMemoryQueryRepository(FlagViewModel),
    },
    {
      provide: FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
      useFactory: () => new InMemoryCommandRepository(Flag),
    },
    {
      provide: FLAG_VALIDATION_SERVICE_INJECTION_TOKEN,
      useClass: FlagValidationService,
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
            CommandHandlerCtor: CreateFlagCommandHandler,
            CommandPayloadCtor: CreateFlag,
          })
          .register({
            CommandHandlerCtor: RelabelFlagCommandHandler,
            CommandPayloadCtor: RelabelFlag,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
  ],
  exports: [FLAG_VALIDATION_SERVICE_INJECTION_TOKEN],
  controllers: [FlagController],
})
export class FlagModule {}
