import { InMemoryQueryRepository } from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import {
  CreateCommunity,
  CreateCommunityCommandHandler,
  TranslateCommunityName,
  TranslateCommunityNameCommandHandler,
} from './commands';
import { InMemoryCommunityCommandRepository } from './commands/repositories';
import { CommunityController } from './community.controller';
import {
  COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN,
  COMMUNITY_QUERY_REPOSITORY_INJECTION_TOKEN,
  COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN,
} from './constants';
import { CommunityValidationService } from './external-services';
import { CommunityQueryService, CommunityViewModel } from './queries';

@Module({
  providers: [
    {
      provide: COMMUNITY_QUERY_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryQueryRepository(CommunityViewModel),
    },
    {
      provide: COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => new InMemoryCommunityCommandRepository(),
    },
    {
      provide: CommandHandlerService,
      useFactory: (moduleRef: ModuleRef) => {
        const commandHandlerService = new CommandHandlerService({
          resolve(injectionToken) {
            return moduleRef.get(injectionToken);
          },
        });

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
