import { TrueImpactError } from '../data-types';
import { ICommandFsa } from './command-flux-standard-action.interface';

export interface CommandSuccessAcknowledgement {
  id: string;
  revision: string;
}

export type CommandResult = TrueImpactError | CommandSuccessAcknowledgement;

export interface ICommandHandler {
  handle(fsa: ICommandFsa): Promise<CommandResult>;
}
