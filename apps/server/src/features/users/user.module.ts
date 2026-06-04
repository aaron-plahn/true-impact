import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { InMemoryQueryRepository } from '../../common/persistence';
import { EncryptionService } from '../../libs/auth';
import { CommandHandlerService } from '../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import { CreateUser } from './commands/create-user.command';
import { CreateUserCommandHandler } from './commands/create-user.command-handler';
import { DeactivateTiSystemUser } from './commands/deactivate-user.command';
import { DeactivateUserCommandHandler } from './commands/deactivate-user.command-handler';
import { GrantUserRole } from './commands/grant-user-role.command';
import { GrantUserRoleCommandHandler } from './commands/grant-user-role.command-handler';
import { UserCommandController } from './commands/user-command.controller';
import {
  TI_SYSTEM_USER_AGGREGATE_TYPE,
  TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN,
  TI_SYSTEM_USER_QUERY_REPOSITORY_INJECTION_TOKEN,
} from './constants';
import { UserViewModel } from './queries';
import { UserQueryController } from './queries/user-query.controller';
import { UserQueryService } from './queries/user-query.service';
import { ITiSystemUserCommandRepository } from './repositories';
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
  // TODO wrap this ina  service
  exports: [TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN],
})
export class UserModule implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit() {
    const isUserDbEmpty = await this.moduleRef
      .get<ITiSystemUserCommandRepository>(
        TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN,
      )
      .isEmpty();

    const INITIAL_ADMIN_PASSWORD_VAR_NAME = 'INITIAL_ADMIN_PASSWORD';

    if (isUserDbEmpty) {
      const adminPasswordFromConfig = this.moduleRef
        .get(ConfigService, { strict: false })
        .get<string | null>(INITIAL_ADMIN_PASSWORD_VAR_NAME);

      const tempAdminPassword =
        adminPasswordFromConfig ||
        this.moduleRef
          // this is a global dep
          .get(EncryptionService, { strict: false })
          .generatePasscode();

      const userCommandHandler = this.moduleRef.get(CommandHandlerService);

      const userCreationCommandPayload: CreateUser = {
        // TODO make this configurable
        username: 'ti-system-admin',
        email: 'tisystemadmin@yoursitehere.org',
        firstName: 'System',
        lastName: 'Admin',
        password: tempAdminPassword,
      };

      const userCreationResult = await userCommandHandler.execute({
        type: CreateUser.type,
        payload: userCreationCommandPayload,
      });

      if (userCreationResult instanceof TrueImpactError) {
        throw new TrueImpactRuntimeException([
          new TrueImpactError(
            `Found an empty user store, but failed to create initial admin user when bootstrapping the application.`,
          ),
          userCreationResult,
        ]);
      }

      const grantAdminUserRolePayload: GrantUserRole = {
        aggregateCompositeIdentifier: {
          type: TI_SYSTEM_USER_AGGREGATE_TYPE,
          id: userCreationResult.id,
        },
        role: 'system admin',
      };

      const grantAdminUserRoleResult = await userCommandHandler.execute({
        type: GrantUserRole.type,
        payload: grantAdminUserRolePayload,
      });

      if (grantAdminUserRoleResult instanceof TrueImpactError) {
        throw new TrueImpactRuntimeException([
          new TrueImpactError(
            `Failed to assign the initial user an admin role when bootstrapping the application.`,
          ),
          grantAdminUserRoleResult,
        ]);
      } else {
        if (!adminPasswordFromConfig) {
          // TODO force a password reset
          console.log(`---- Initial Admin Password ----`);
          console.log(tempAdminPassword);
          console.log(
            `Be sure to copy this password as it will not be available later. \nChange the admin password after signing in. You may also want to deactivate this user after creating another admin user.`,
          );
        } else {
          console.log(
            `---- Seeded initial user with value from environment var: ${INITIAL_ADMIN_PASSWORD_VAR_NAME}`,
          );
        }
      }
    }
  }
}
