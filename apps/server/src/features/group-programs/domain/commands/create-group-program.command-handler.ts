import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { CreateGroupProgram } from './create-group-program.command';

export class CreateGroupProgramCommandHandler implements ICommandHandler<CreateGroupProgram> {
  handle(_fsa: { payload: CreateGroupProgram }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
