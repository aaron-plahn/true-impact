import { Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InMemoryQueryRepository } from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { CreateUser } from './commands/create-user.command';
import { CreateUserCommandHandler } from './commands/create-user.command-handler';
import { DeactivateTiSystemUser } from './commands/deactivate-user.command';
import { DeactivateUserCommandHandler } from './commands/deactivate-user.command-handler';
import { GrantUserRole } from './commands/grant-user-role.command';
import { GrantUserRoleCommandHandler } from './commands/grant-user-role.command-handler';
import { UserCommandController } from './commands/user-command.controller';
import {
  TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN,
  TI_SYSTEM_USER_QUERY_REPOSITORY_INJECTION_TOKEN,
} from './constants';
import { UserViewModel } from './queries';
import { UserQueryController } from './queries/user-query.controller';
import { UserQueryService } from './queries/user-query.service';
import { InMemoryTiSystemUserCommandRepository } from './repositories/in-memory-ti-system-user-command.repository';

@Module({
  providers: [
    {
      provide: TI_SYSTEM_USER_QUERY_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryQueryRepository(UserViewModel),
    },
    {
      provide: TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useClass: InMemoryTiSystemUserCommandRepository,
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
          {
            publishEvent: (_e) => {
              // TODO User Events Gateway
              return Promise.resolve();
            },
          },
        );

        commandHandlerService
          .register({
            CommandHandlerCtor: CreateUserCommandHandler,
            CommandPayloadCtor: CreateUser,
          })
          .register({
            CommandHandlerCtor: GrantUserRoleCommandHandler,
            CommandPayloadCtor: GrantUserRole,
          })
          .register({
            CommandHandlerCtor: DeactivateUserCommandHandler,
            // TODO name this pair consistently
            CommandPayloadCtor: DeactivateTiSystemUser,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
    CreateUserCommandHandler,
    GrantUserRoleCommandHandler,
    DeactivateUserCommandHandler,
    UserQueryService,
  ],
  controllers: [UserQueryController, UserCommandController],
})
export class UserModule {}
