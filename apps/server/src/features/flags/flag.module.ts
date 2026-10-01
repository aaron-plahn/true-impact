import { EventFactory } from 'src/postgresql/event-factory';
import { AuthModule } from '../../auth/auth.module';
import { InMemoryQueryRepository } from '../../common/persistence';
import {
  CommandHandlerService,
  EVENT_REPOSITORY_INJECTION_TOKEN,
  EventSourcedCommandRepository,
  IEventRepository,
} from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { UserModule } from '../users/user.module';
import {
  CreateFlag,
  FlagCreated,
  FlagRelabelled,
  RelabelFlag,
  RelabelFlagCommandHandler,
} from './commands';
import { CreateFlagCommandHandler } from './commands/create-flag.command-handler';
import {
  FLAG_AGGREGATE_TYPE,
  FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
  FLAG_QUERY_REPOSITORY_DEPENDENCY_TOKEN,
  FLAG_VALIDATION_SERVICE_INJECTION_TOKEN,
} from './constants';
import { FlagValidationService } from './external-services';
import { FlagController } from './flag.controller';
import { Flag } from './models';
import { FlagQueryService, FlagViewModel } from './queries';

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
      useFactory: (
        eventRepository: IEventRepository,
        eventFactory: EventFactory,
      ) => {
        eventFactory
          .register('FLAG_CREATED', (doc) =>
            FlagCreated.fromPersistenceDto(doc as unknown as FlagCreated),
          )
          .register('FLAG_RELABELLED', (doc) =>
            FlagRelabelled.fromPersistenceDto(doc as unknown as FlagRelabelled),
          );

        // shouldn't we inject the event factory here instead?
        return new EventSourcedCommandRepository(
          eventRepository,
          FLAG_AGGREGATE_TYPE,
          (eventHistory) => Flag.fromEventHistory(eventHistory),
        );
      },
      inject: [EVENT_REPOSITORY_INJECTION_TOKEN, EventFactory],
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
