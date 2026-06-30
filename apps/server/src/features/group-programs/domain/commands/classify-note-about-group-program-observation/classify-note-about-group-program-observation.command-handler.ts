import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import { ResourceNotFoundError } from '../../../../../libs/data-types';
import { GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../constants';
import type { IGroupProgramCommandRepository } from '../group-command-repository.interface';
import { ClassifyNoteAboutGroupProgramObservation } from './classify-note-about-group-program-observation.command';

export class ClassifyNoteAboutGroupProgramObservationCommandHandler implements ICommandHandler<ClassifyNoteAboutGroupProgramObservation> {
  constructor(
    @Inject(GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly programRepository: IGroupProgramCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier,
      sessionId,
      observationId,
      interactionType,
    },
  }: {
    payload: ClassifyNoteAboutGroupProgramObservation;
  }): Promise<CommandResult> {
    const { id } = aggregateCompositeIdentifier;

    const target = await this.programRepository.fetchById(id);

    if (!target) {
      return new ResourceNotFoundError(aggregateCompositeIdentifier);
    }

    const updateResult = target.classifyObservation({
      sessionId,
      observationId,
      interactionType,
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
