import {
  CommandResult,
  ICommandHandler,
  ICommandPayload,
} from '../../../libs/cqrs-es';

// @CommandHandler
export class CreateSurveyCommandHandler implements ICommandHandler {
  handle(_fsa: { payload: ICommandPayload }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
