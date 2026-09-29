import { forwardRef } from '@nestjs/common';
import { EventFactory } from 'src/postgresql/event-factory';
import {
  CommandHandlerService,
  EVENT_REPOSITORY_INJECTION_TOKEN,
  IEventRepository,
} from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
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

import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import { PostgresClientCommandRepository } from './repositories/postgres-client-command-repository';
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

        return new PostgresClientCommandRepository(eventRepository);
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
