import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { Client } from '../client.aggregate-root';
import { CLIENT_AGGREGATE_TYPE } from '../client.composite-identifier';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IClientCommandRepository } from '../repositories';
import { CreateClient } from './create-client.command';

export class CreateClientCommandHandler implements ICommandHandler {
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly clientCommandRepository: IClientCommandRepository,
  ) {}

  async handle({
    payload: command,
  }: {
    payload: CreateClient;
  }): Promise<CommandResult> {
    const buildResult = Client.fromCreateClientCommand(command);

    if (buildResult instanceof TrueImpactError) {
      return buildResult;
    }

    const persistenceResult =
      await this.clientCommandRepository.create(buildResult);

    if (persistenceResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([persistenceResult]);
    }

    return {
      id: persistenceResult,
      revision: 'oops',
      type: CLIENT_AGGREGATE_TYPE,
    };
  }
}
