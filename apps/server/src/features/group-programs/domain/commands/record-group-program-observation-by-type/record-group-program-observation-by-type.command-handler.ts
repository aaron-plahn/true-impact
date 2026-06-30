import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import { ResourceNotFoundError } from '../../../../../libs/data-types';
import { GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../constants';
import type { IGroupProgramCommandRepository } from '../group-command-repository.interface';
import { RecordGroupProgramObservationByType } from './record-group-program-observation-by-type.command';

export class RecordGroupProgramObservationByTypeCommandHandler implements ICommandHandler<RecordGroupProgramObservationByType> {
  constructor(
    @Inject(GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly programRepository: IGroupProgramCommandRepository,
  ) {}

  async handle({
    payload: { aggregateCompositeIdentifier, interactionType, sessionId },
  }: {
    payload: RecordGroupProgramObservationByType;
  }): Promise<CommandResult> {
    const { id } = aggregateCompositeIdentifier;

    const target = await this.programRepository.fetchById(id);

    if (!target) {
      return new ResourceNotFoundError(aggregateCompositeIdentifier);
    }

    const updateResult = target.recordObservationByType({
      interactionType,
      sessionId,
    });

    if (updateResult instanceof Error) {
      return updateResult;
    }

    const persistenceResult = await this.programRepository.update(updateResult);

    if (persistenceResult instanceof Error) {
      return persistenceResult;
    }

    Object.assign(persistenceResult, {
      events: [updateResult.eventHistory.at(-1)],
    });

    return persistenceResult;
  }
}
