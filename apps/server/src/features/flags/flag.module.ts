import { AuthModule } from '../../auth/auth.module';
import { InMemoryQueryRepository } from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { ConfigService, Module, ModuleRef } from '../../libs/framework';
import { UserModule } from '../users/user.module';
import { CreateFlag, RelabelFlag, RelabelFlagCommandHandler } from './commands';
import { CreateFlagCommandHandler } from './commands/create-flag.command-handler';
import {
  FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
  FLAG_QUERY_REPOSITORY_DEPENDENCY_TOKEN,
  FLAG_VALIDATION_SERVICE_INJECTION_TOKEN,
} from './constants';
import { FlagValidationService } from './external-services';
import { FlagController } from './flag.controller';
import { FlagQueryService, FlagViewModel } from './queries';
import { InMemoryFlagCommandRepository } from './repositories';

@Module({
  imports: [UserModule, AuthModule],
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
      useFactory: (configService: ConfigService) =>
        new InMemoryFlagCommandRepository(new Map(), configService),
      inject: [ConfigService],
    },
    {
      provide: FLAG_VALIDATION_SERVICE_INJECTION_TOKEN,
      useClass: FlagValidationService,
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
          // TODO FlagEventsGateway
          {
            publishEvent: (_e) => {
              return Promise.resolve();
            },
          },
        );

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
  exports: [FLAG_VALIDATION_SERVICE_INJECTION_TOKEN, FlagQueryService],
  controllers: [FlagController],
})
export class FlagModule {}
