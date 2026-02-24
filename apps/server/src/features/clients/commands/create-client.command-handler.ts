import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { Client } from '../client.aggregate-root';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IClientCommandRepository } from '../repositories';
import { CreateClient } from './create-client.command';

export class CreateClientCommandHandler {
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly clientCommandRepository: IClientCommandRepository,
  ) {}

  async execute(
    command: CreateClient,
  ): Promise<{ id: string } | TrueImpactBadUserInputError> {
    const buildResult = Client.fromCreateClientCommand(command);

    if (buildResult instanceof TrueImpactError) {
      return buildResult;
    }

    const persistenceResult =
      await this.clientCommandRepository.create(buildResult);

    if (persistenceResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([persistenceResult]);
    }

    return { id: persistenceResult };
  }
}
