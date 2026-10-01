import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import { Flag } from '../models';
import type { IFlagCommandRepository } from '../repositories';
import { CreateFlag } from './create-flag.command';

export class CreateFlagCommandHandler implements ICommandHandler<CreateFlag> {
  constructor(
    @Inject(FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: IFlagCommandRepository,
  ) {}

  async handle({
    payload: { label, description },
  }: {
    payload: CreateFlag;
  }): Promise<CommandResult> {
    const buildResult = Flag.fromClientRequest({ label, description });

    if (buildResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([buildResult]);
    }

    /**
     * This is not the scalable way to do this. See comments in the `RelabelFlagCommandHandler`.
     */
    const allFlags = await this.repository.fetchMany();

    if (allFlags.some((f) => f.label === label)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(`Uniqueness constraint violated.`),
        new TrueImpactError(
          `The label [${label}] is already in use by another flag.`,
        ),
      ]);
    }

    const persistenceResult = await this.repository.create(buildResult);

    return persistenceResult;
  }
}
