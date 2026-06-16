import { TrueImpactError } from '../data-types';
import { ICommandPayload } from './command-flux-standard-action.interface';
import { IDomainEvent } from './domain-event.interface';

export interface PersistenceAcknowledgement {
  type: string;
  id: string;
  revision: string;
  /**
   * Some resources (e.g. Survey Responses) permit anonymous (unauthenticated) access via a temporary
   * access token.
   */
  accessCode?: string;
}

/**
 * TODO Should the database be aware of these?
 */
export interface CommandSuccessAcknowledgement extends PersistenceAcknowledgement {
  events?: IDomainEvent[];
}

export type CommandResult = TrueImpactError | CommandSuccessAcknowledgement;

export interface ICommandHandler<
  TPayload extends ICommandPayload = ICommandPayload,
> {
  handle(fsa: { payload: TPayload }): Promise<CommandResult>;
}
