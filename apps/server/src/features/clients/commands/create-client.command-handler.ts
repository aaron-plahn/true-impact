import { randomUUID } from 'node:crypto';
import { COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN } from '../../../features/communities/constants';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  isNonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { Client } from '../client.aggregate-root';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IClientCommandRepository } from '../repositories';
import { CreateClient } from './create-client.command';

interface ICommunityValidationService {
  exists(communityId: string): Promise<boolean>;
}

export class CreateClientCommandHandler implements ICommandHandler {
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly clientCommandRepository: IClientCommandRepository,
    @Inject(COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN)
    private readonly communityValidationService: ICommunityValidationService,
  ) {}

  async handle({
    payload: command,
  }: {
    payload: CreateClient;
  }): Promise<CommandResult> {
    const { communityId } = command;

    if (isNonEmptyString(communityId)) {
      const doesCommunityExist =
        await this.communityValidationService.exists(communityId);

      if (!doesCommunityExist) {
        return new TrueImpactBadUserInputError([
          new TrueImpactError(
            `Failed to create client from community [${communityId}], as there is no such community.`,
          ),
        ]);
      }
    }

    const generatedId = randomUUID();

    // There's no reason to clone as there is only 1 reference to the command
    Object.assign(command, { id: generatedId });

    const buildResult = Client.fromCreateClientCommand(
      // TS is unaware of the Object.assign above
      command as CreateClient & { id: string },
    );

    if (buildResult instanceof TrueImpactError) {
      return buildResult;
    }

    const persistenceResult =
      await this.clientCommandRepository.create(buildResult);

    if (persistenceResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([persistenceResult]);
    }

    return persistenceResult;
  }
}
