import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { MakeNoteAboutGroupProgramObservation } from './make-note-about-group-program-observation.command';

export class MakeNoteAboutGroupProgramObservationCommandHandler implements ICommandHandler<MakeNoteAboutGroupProgramObservation> {
  handle(_fsa: {
    payload: MakeNoteAboutGroupProgramObservation;
  }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
