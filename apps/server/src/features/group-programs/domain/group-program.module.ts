import { EventFactory } from 'src/postgresql/event-factory';
import { AuthModule } from '../../../auth/auth.module';
import { InMemoryQueryRepository } from '../../../common/persistence';
import { UserModule } from '../../../features/users/user.module';
import {
  CommandHandlerService,
  EVENT_REPOSITORY_INJECTION_TOKEN,
  EventSourcedCommandRepository,
  IEventRepository,
} from '../../../libs/cqrs-es';
import { Module, ModuleRef } from '../../../libs/framework';
import { GroupProgramQueryService, GroupProgramViewModel } from '../queries';
import {
  ClassifyNoteAboutGroupProgramObservation,
  ClassifyNoteAboutGroupProgramObservationCommandHandler,
  CreateGroupProgram,
  GroupProgramCreated,
  GroupProgramObservationRecordedByType,
  GroupProgramSessionScheduled,
  MakeNoteAboutGroupProgramObservation,
  MakeNoteAboutGroupProgramObservationCommandHandler,
  NoteAboutGroupProgramClassified,
  NoteAboutGroupProgramObservationMade,
  RecordGroupProgramObservationByType,
  RecordGroupProgramObservationByTypeCommandHandler,
  ScheduleGroupProgramSession,
  ScheduleGroupProgramSessionCommandHandler,
} from './commands';
import { CreateGroupProgramCommandHandler } from './commands/create-group-program/create-group-program.command-handler';
import {
  GROUP_PROGRAM_AGGREGATE_TYPE,
  GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN,
  GROUP_PROGRAM_QUERY_REPOSITORY_INJECTION_TOKEN,
} from './constants';
import { GroupProgramCommandController } from './group-program-command.controller';
import { GroupProgramQueryController } from './group-program-query.controller';
import { GroupProgram } from './group-program.aggregate-root';

@Module({
  imports: [UserModule, AuthModule],
  providers: [
    GroupProgramQueryService,
    CreateGroupProgramCommandHandler,
    ScheduleGroupProgramSessionCommandHandler,
    RecordGroupProgramObservationByTypeCommandHandler,
    MakeNoteAboutGroupProgramObservationCommandHandler,
    ClassifyNoteAboutGroupProgramObservationCommandHandler,
    {
      provide: GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: (
        eventRepository: IEventRepository,
        eventFactory: EventFactory,
      ) => {
        eventFactory
          .register('GROUP_PROGRAM_CREATED', (doc) =>
            GroupProgramCreated.fromPersistenceDto(
              doc as unknown as GroupProgramCreated,
            ),
          )
          .register('NOTE_ABOUT_GROUP_PROGRAM_CLASSIFIED', (doc) =>
            NoteAboutGroupProgramClassified.fromPersistenceDto(
              doc as unknown as NoteAboutGroupProgramClassified,
            ),
          )
          .register('NOTE_ABOUT_GROUP_PROGRAM_OBSERVATION_MADE', (doc) =>
            NoteAboutGroupProgramObservationMade.fromPersistenceDto(
              doc as unknown as NoteAboutGroupProgramObservationMade,
            ),
          )
          .register('GROUP_PROGRAM_OBSERVATION_RECORDED_BY_TYPE', (doc) =>
            GroupProgramObservationRecordedByType.fromPersistenceDto(
              doc as unknown as GroupProgramObservationRecordedByType,
            ),
          )
          .register('GROUP_PROGRAM_SESSION_SCHEDULED', (doc) =>
            GroupProgramSessionScheduled.fromPersistenceDto(
              doc as unknown as GroupProgramSessionScheduled,
            ),
          );

        return new EventSourcedCommandRepository(
          eventRepository,
          GROUP_PROGRAM_AGGREGATE_TYPE,
          (eventHistory) => GroupProgram.fromEventHistory(eventHistory),
        );
      },
      inject: [EVENT_REPOSITORY_INJECTION_TOKEN, EventFactory],
    },
    {
      provide: GROUP_PROGRAM_QUERY_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryQueryRepository(GroupProgramViewModel),
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
            CommandHandlerCtor: CreateGroupProgramCommandHandler,
            CommandPayloadCtor: CreateGroupProgram,
          })
          .register({
            CommandHandlerCtor: ScheduleGroupProgramSessionCommandHandler,
            CommandPayloadCtor: ScheduleGroupProgramSession,
          })
          .register({
            CommandHandlerCtor:
              RecordGroupProgramObservationByTypeCommandHandler,
            CommandPayloadCtor: RecordGroupProgramObservationByType,
          })
          .register({
            CommandHandlerCtor:
              MakeNoteAboutGroupProgramObservationCommandHandler,
            CommandPayloadCtor: MakeNoteAboutGroupProgramObservation,
          })
          .register({
            CommandHandlerCtor:
              ClassifyNoteAboutGroupProgramObservationCommandHandler,
            CommandPayloadCtor: ClassifyNoteAboutGroupProgramObservation,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
  ],
  controllers: [GroupProgramCommandController, GroupProgramQueryController],
})
export class GroupProgramModule {}
