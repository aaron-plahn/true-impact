import { AuthModule } from '../../auth/auth.module';
import { InMemoryQueryRepository } from '../../common/persistence';
import {
  CommandHandlerService,
  EVENT_REPOSITORY_INJECTION_TOKEN,
  EventSourcedCommandRepository,
  IEventRepository,
} from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { EventFactory } from '../../postgresql/event-factory';
import { UserModule } from '../users/user.module';
import {
  CommunityCreated,
  CommunityNameTranslated,
  CreateCommunity,
  CreateCommunityCommandHandler,
  TranslateCommunityName,
  TranslateCommunityNameCommandHandler,
} from './commands';
import { CommunityController } from './community.controller';
import {
  COMMUNITY_AGGREGATE_TYPE,
  COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN,
  COMMUNITY_QUERY_REPOSITORY_INJECTION_TOKEN,
  COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN,
} from './constants';
import { CommunityValidationService } from './external-services';
import { Community } from './models';
import { CommunityQueryService, CommunityViewModel } from './queries';

@Module({
  imports: [UserModule, AuthModule],
  providers: [
    {
      provide: COMMUNITY_QUERY_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryQueryRepository(CommunityViewModel),
    },
    {
      provide: COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: (
        eventRepository: IEventRepository,
        eventFactory: EventFactory,
      ) => {
        eventFactory
          .register('COMMUNITY_CREATED', (dto) =>
            CommunityCreated.fromPersistenceDto(
              dto as unknown as CommunityCreated,
            ),
          )
          .register('COMMUNITY_NAME_TRANSLATED', (dto) =>
            CommunityNameTranslated.fromPersistenceDto(
              dto as unknown as CommunityNameTranslated,
            ),
          );

        return new EventSourcedCommandRepository(
          eventRepository,
          COMMUNITY_AGGREGATE_TYPE,
          (eventHistory) => Community.fromEventHistory(eventHistory),
        );
      },
      inject: [EVENT_REPOSITORY_INJECTION_TOKEN, EventFactory],
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
          // TODO CommunityEventsGateway
          {
            publishEvent: (_e) => {
              return Promise.resolve();
            },
          },
        );

        commandHandlerService
          .register({
            CommandHandlerCtor: CreateCommunityCommandHandler,
            CommandPayloadCtor: CreateCommunity,
          })
          .register({
            CommandHandlerCtor: TranslateCommunityNameCommandHandler,
            CommandPayloadCtor: TranslateCommunityName,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
    // Commands
    CreateCommunityCommandHandler,
    TranslateCommunityNameCommandHandler,
    // External Services
    CommunityQueryService,
    {
      provide: COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN,
      useClass: CommunityValidationService,
    },
  ],
  exports: [
    CommunityQueryService,
    COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN,
  ],
  controllers: [CommunityController],
})
export class CommunityModule {}
