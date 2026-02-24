import { TrueImpactError } from '../data-types';
import { ICommandPayload } from './command-flux-standard-action.interface';

export interface CommandSuccessAcknowledgement {
  type: string;
  id: string;
  revision: string;
}

export type CommandResult = TrueImpactError | CommandSuccessAcknowledgement;

export interface ICommandHandler<
  TPayload extends ICommandPayload = ICommandPayload,
> {
  handle(fsa: { payload: TPayload }): Promise<CommandResult>;
}
