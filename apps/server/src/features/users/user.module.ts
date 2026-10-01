import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { EventFactory } from 'src/postgresql/event-factory';
import { InMemoryQueryRepository } from '../../common/persistence';
import { EncryptionService } from '../../libs/auth';
import {
  CommandHandlerService,
  EVENT_REPOSITORY_INJECTION_TOKEN,
  EventSourcedCommandRepository,
  IEventRepository,
} from '../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  CreateUserWithPassword,
  CreateUserWithPasswordCommandHandler,
  DeactivateUser,
  DeactivateUserCommandHandler,
  GrantUserRole,
  GrantUserRoleCommandHandler,
  UserDeactivated,
  UserGrantedRole,
  UserWithPasswordCreated,
} from './commands';
import { UserCommandController } from './commands/user-command.controller';
import {
  USER_COMMAND_REPOSITORY_INJECTION_TOKEN,
  USER_QUERY_REPOSITORY_INJECTION_TOKEN,
} from './constants';
import { UserViewModel } from './queries';
import { UserQueryController } from './queries/user-query.controller';
import { UserQueryService } from './queries/user-query.service';
import type { IUserCommandRepository } from './repositories';
import { User } from './user.aggregate-root';
import { USER_AGGREGATE_TYPE } from './user.composite-identifier';

@Module({
  providers: [
    {
      provide: USER_QUERY_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryQueryRepository(UserViewModel),
    },
    {
      /**
       * CLEAR will cause trouble if it removes the bootstrapped
       * initial system admin. We probably shouldn't ever
       * remove users in tests, but instead create one user of every
       * desired identity.
       */
      provide: USER_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: (
        eventRepository: IEventRepository,
        eventFactory: EventFactory,
      ) => {
        eventFactory
          .register('USER_WITH_PASSWORD_CREATED', (doc) =>
            UserWithPasswordCreated.fromPersistenceDto(
              doc as unknown as UserWithPasswordCreated,
            ),
          )
          .register('USER_GRANTED_ROLE', (doc) =>
            UserGrantedRole.fromPersistenceDto(
              doc as unknown as UserGrantedRole,
            ),
          )
          .register('USER_DEACTIVATED', (doc) =>
            UserDeactivated.fromPersistenceDto(
              doc as unknown as UserDeactivated,
            ),
          );

        return new EventSourcedCommandRepository(
          eventRepository,
          USER_AGGREGATE_TYPE,
          (eventHistory) => User.fromEventHistory(eventHistory),
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
          {
            publishEvent: (_e) => {
              // TODO User Events Gateway
              return Promise.resolve();
            },
          },
        );

        commandHandlerService
          .register({
            CommandHandlerCtor: CreateUserWithPasswordCommandHandler,
            CommandPayloadCtor: CreateUserWithPassword,
          })
          .register({
            CommandHandlerCtor: GrantUserRoleCommandHandler,
            CommandPayloadCtor: GrantUserRole,
          })
          .register({
            CommandHandlerCtor: DeactivateUserCommandHandler,
            CommandPayloadCtor: DeactivateUser,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
    CreateUserWithPasswordCommandHandler,
    GrantUserRoleCommandHandler,
    DeactivateUserCommandHandler,
    UserQueryService,
  ],
  controllers: [UserQueryController, UserCommandController],
  // TODO wrap this in a  service
  exports: [USER_COMMAND_REPOSITORY_INJECTION_TOKEN],
})
export class UserModule implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit() {
    const isUserDbEmpty = await this.moduleRef
      .get<IUserCommandRepository>(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)

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

      const defaultAdminUsername =
        this.moduleRef
          .get(ConfigService, { strict: false })
          .get<string | null>('SYSTEM_ADMIN_USERNAME') || 'ti-admin-user';

      const userCommandHandler = this.moduleRef.get(CommandHandlerService);

      const userCreationCommandPayload: CreateUserWithPassword = {
        // TODO make this configurable
        username: defaultAdminUsername,
        email: 'tisystemadmin@yoursitehere.org',
        firstName: 'System',
        lastName: 'Admin',
        password: tempAdminPassword,
      };

      const userCreationResult = await userCommandHandler.execute({
        type: CreateUserWithPassword.type,
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
          type: USER_AGGREGATE_TYPE,
          id: userCreationResult.id,
        },
        /**
         * This should be a constant, although maybe not an enum. The question of whether it is
         * an enum comes down to whether the set of user roles is closed. In all likelihood,
         * we will introduce more rich attribute-based access control in the long run that makes
         * this property irrelevant or supplementary, though.
         */
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
            // Note that we are logging the name of the env var, not its value here
            `---- Seeded initial user with value from environment var: ${INITIAL_ADMIN_PASSWORD_VAR_NAME}`,
          );
        }
      }
    }
  }
}
