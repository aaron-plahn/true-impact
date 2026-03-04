import { TrueImpactError } from '../data-types';
import { ICommandPayload } from './command-flux-standard-action.interface';

export interface PersistenceAcknowledgement {
  type: string;
  id: string;
  revision: string;
}

export type CommandResult = TrueImpactError | PersistenceAcknowledgement;

export interface ICommandHandler<
  TPayload extends ICommandPayload = ICommandPayload,
> {
  handle(fsa: { payload: TPayload }): Promise<CommandResult>;
}
