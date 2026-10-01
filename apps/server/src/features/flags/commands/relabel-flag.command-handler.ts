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
    /**
     * This does not scale. We need to introduce a flag reservation system.
     *
     * Alternatively, we could consider persisting flags in a state-based way,
     * which would make validating global uniqueness efficient at the cost of losing
     * a detailed event history.
     */
    /**
     * TODO write a stress test to see how many flags we can add before this inefficiency causes flags to slow down.
     * If we will only ever have a handful of flags for a given tenant, this is not a big deal.
     */
    const allFlags = await this.repository.fetchMany();

    const existing =
      allFlags.find((f) => f.id === id) ||
      new TrueImpactError(
        `You cannot relabel flag [${id}], as there is no such flag.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    if (allFlags.some((f) => f.label === newLabel)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(`Uniqueness constraint violated.`),
        new TrueImpactError(
          `The label [${newLabel}] is already in use by another flag.`,
        ),
      ]);
    }

    const updated = existing.relabel({ newLabel });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
