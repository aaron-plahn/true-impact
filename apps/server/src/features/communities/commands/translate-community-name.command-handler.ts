import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import { TranslateCommunityName } from './translate-community-name.command';

export class TranslateCommunityNameCommandHandler implements ICommandHandler<TranslateCommunityName> {
  handle(_fsa: { payload: TranslateCommunityName }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
