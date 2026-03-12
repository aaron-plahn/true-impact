import { Inject } from '@nestjs/common';
import { FLAG_VALIDATION_SERVICE_INJECTION_TOKEN } from '../../../features/flags/constants';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IClientCommandRepository } from '../repositories';
import { FlagClient } from './flag-client.command';

interface IFlagValidationService {
  exists(flagId: string): Promise<boolean>;
}

export class FlagClientCommandHandler implements ICommandHandler<FlagClient> {
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: IClientCommandRepository,
    @Inject(FLAG_VALIDATION_SERVICE_INJECTION_TOKEN)
    private readonly flagValidationService: IFlagValidationService,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id: clientId },
      flagId,
    },
  }: {
    payload: FlagClient;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(clientId)) ||
      new TrueImpactError(
        `You cannot flag client [${clientId}], as there is no such client.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const doesFlagExist = await this.flagValidationService.exists(flagId);

    if (!doesFlagExist) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot flag client [${clientId}] with flag [${flagId}], as there is no such flag.`,
        ),
      ]);
    }

    const updated = existing.flag(flagId);

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
