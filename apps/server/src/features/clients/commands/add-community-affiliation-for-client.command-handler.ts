import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { AddCommunityAffiliationForClient } from './add-community-affiliation-for-client';

export class AddCommunityAffiliationForClientCommandHandler implements ICommandHandler<AddCommunityAffiliationForClient> {
  handle(_fsa: {
    payload: AddCommunityAffiliationForClient;
  }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
