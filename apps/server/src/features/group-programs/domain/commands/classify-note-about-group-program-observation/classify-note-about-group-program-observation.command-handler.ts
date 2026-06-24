import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { ClassifyNoteAboutGroupProgramObservation } from './classify-note-about-group-program-observation.command';

export class ClassifyNoteAboutGroupProgramObservationCommandHAndler implements ICommandHandler<ClassifyNoteAboutGroupProgramObservation> {
  handle(_fsa: {
    payload: ClassifyNoteAboutGroupProgramObservation;
  }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
