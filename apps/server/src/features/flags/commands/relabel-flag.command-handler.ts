import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import type { IFlagCommandRepository } from '../repositories';
import { RelabelFlag } from './relabel-flag.command';

export class RelabelFlagCommandHandler implements ICommandHandler<RelabelFlag> {
  constructor(
    @Inject(FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: IFlagCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      newLabel,
    },
  }: {
    payload: RelabelFlag;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot relabel flag [${id}], as there is no such flag.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const updated = existing.relabel({ newLabel });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
