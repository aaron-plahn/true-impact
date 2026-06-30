import { AuthModule } from '../../../auth/auth.module';
import { InMemoryQueryRepository } from '../../../common/persistence';
import { UserModule } from '../../../features/users/user.module';
import { CommandHandlerService } from '../../../libs/cqrs-es';
import { Module, ModuleRef } from '../../../libs/framework';
import { GroupProgramQueryService, GroupProgramViewModel } from '../queries';
import {
  ClassifyNoteAboutGroupProgramObservation,
  ClassifyNoteAboutGroupProgramObservationCommandHandler,
  CreateGroupProgram,
  MakeNoteAboutGroupProgramObservation,
  MakeNoteAboutGroupProgramObservationCommandHandler,
  RecordGroupProgramObservationByType,
  RecordGroupProgramObservationByTypeCommandHandler,
  ScheduleGroupProgramSession,
  ScheduleGroupProgramSessionCommandHandler,
} from './commands';
import { CreateGroupProgramCommandHandler } from './commands/create-group-program/create-group-program.command-handler';
import {
  GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN,
  GROUP_PROGRAM_QUERY_REPOSITORY_INJECTION_TOKEN,
} from './constants';
import { GroupProgramCommandController } from './group-program-command.controller';
import { GroupProgramQueryController } from './group-program-query.controller';
import { InMemoryGroupProgramCommandRepository } from './repositories/in-memory-group-program-command-repository';

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
      useClass: InMemoryGroupProgramCommandRepository,
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
