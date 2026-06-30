import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import { ResourceNotFoundError } from '../../../../../libs/data-types';
import { GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../constants';
import type { IGroupProgramCommandRepository } from '../group-command-repository.interface';
import { MakeNoteAboutGroupProgramObservation } from './make-note-about-group-program-observation.command';

export class MakeNoteAboutGroupProgramObservationCommandHandler implements ICommandHandler<MakeNoteAboutGroupProgramObservation> {
  constructor(
    @Inject(GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly programRepository: IGroupProgramCommandRepository,
  ) {}

  async handle({
    payload: { aggregateCompositeIdentifier, note, sessionId },
  }: {
    payload: MakeNoteAboutGroupProgramObservation;
  }): Promise<CommandResult> {
    const { id } = aggregateCompositeIdentifier;

    const target = await this.programRepository.fetchById(id);

    if (!target) {
      return new ResourceNotFoundError(aggregateCompositeIdentifier);
    }

    const updateResult = target.makeNote({
      sessionId,
      note: {
        text: note.text,
        // we default to English for the language code
        languageCode: note.languageCode || 'en',
      },
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
