import { Inject } from '@nestjs/common';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IClientCommandRepository } from '../repositories';

export class ClientValidationService {
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: IClientCommandRepository,
  ) {}

  exists(id: string): Promise<boolean> {
    return this.repository.exists(id);
  }
}
