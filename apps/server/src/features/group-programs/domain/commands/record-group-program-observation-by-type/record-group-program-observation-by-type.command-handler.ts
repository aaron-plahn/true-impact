import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { RecordGroupProgramObservationByType } from './record-group-program-observation-by-type.command';

export class RecordGroupProgramObservationByTypeCommandHandler implements ICommandHandler<RecordGroupProgramObservationByType> {
  handle(_fsa: {
    payload: RecordGroupProgramObservationByType;
  }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
