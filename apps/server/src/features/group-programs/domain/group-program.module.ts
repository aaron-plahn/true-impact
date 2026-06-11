import { AuthModule } from 'src/auth/auth.module';
import { InMemoryQueryRepository } from 'src/common/persistence';
import { UserModule } from 'src/features/users/user.module';
import { CommandHandlerService } from 'src/libs/cqrs-es';
import { Module, ModuleRef } from '../../../libs/framework';
import { GroupProgramQueryService } from '../queries/group-program-query.service';
import { GroupProgramViewModel } from '../queries/group-program.view-model';
import { CreateGroupProgram } from './commands/create-group-program.command';
import { CreateGroupProgramCommandHandler } from './commands/create-group-program.command-handler';
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

        commandHandlerService.register({
          CommandHandlerCtor: CreateGroupProgramCommandHandler,
          CommandPayloadCtor: CreateGroupProgram,
        });

        return commandHandlerService;
      },
    },
  ],
  controllers: [GroupProgramCommandController, GroupProgramQueryController],
})
export class GroupProgramModule {}
