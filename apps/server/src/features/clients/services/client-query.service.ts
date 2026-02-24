import { Inject } from '../../../libs/framework';
import { Client } from '../client.aggregate-root';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IClientCommandRepository } from '../repositories';

export class ClientQueryService {
  // For now, we project off the domain (command) models. In the future, we may have a query DB separate from our operational DB.
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: IClientCommandRepository,
  ) {}

  // TODO We may want to inject the user context for permissions.
  fetchById(id: string): Promise<Client | null> {
    return this.repository.fetchById(id) as Promise<Client | null>;
  }
}
