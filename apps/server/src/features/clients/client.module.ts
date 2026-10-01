import { forwardRef } from '@nestjs/common';
import {
  CommandHandlerService,
  DomainEvent,
  EVENT_REPOSITORY_INJECTION_TOKEN,
  EventSourcedCommandRepository,
  IEventRepository,
} from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { EventFactory } from '../../postgresql/event-factory';
import { CommunityModule } from '../communities/community.module';
import { FlagModule } from '../flags/flag.module';
import { SurveyModule } from '../survey/survey.module';
import { UserModule } from '../users/user.module';
import { ClientController } from './client.controller';
import {
  AddCommunityAffiliationForClient,
  AddCommunityAffiliationForClientCommandHandler,
  ClientCreated,
  CreateClient,
  CreateClientCommandHandler,
  FlagClient,
  FlagClientCommandHandler,
} from './commands';

import { Client } from './client.aggregate-root';
import { CLIENT_AGGREGATE_TYPE } from './client.composite-identifier';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import { ClientValidationService } from './services';
import { ClientQueryService } from './services/client-query.service';

@Module({
  imports: [
    FlagModule,
    CommunityModule,
    UserModule,
    forwardRef(() => SurveyModule),
  ],
  providers: [
    ClientQueryService,
    // Commands
    CreateClientCommandHandler,
    FlagClientCommandHandler,
    AddCommunityAffiliationForClientCommandHandler,
    {
      provide: CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: (
        eventRepository: IEventRepository,
        eventFactory: EventFactory,
      ) => {
        eventFactory.register('CLIENT_CREATED', (doc) => {
          return ClientCreated.fromPersistenceDto(
            doc as unknown as ClientCreated,
          );
        });

        return new EventSourcedCommandRepository(
          eventRepository,
          CLIENT_AGGREGATE_TYPE,
          (eventHistory: Iterable<DomainEvent>) =>
            Client.fromEventHistory(eventHistory),
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
          // TODO Should this be a generic events gateway or a client events gateway?
          {
            publishEvent: (_e) => {
              return Promise.resolve();
            },
          },
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
