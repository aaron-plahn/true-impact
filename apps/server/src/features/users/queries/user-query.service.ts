import { Inject } from '@nestjs/common';
import { TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { ITiSystemUserCommandRepository } from '../repositories';
import { TiSystemUser } from '../ti-system-user.aggregate-root';
import { UserViewModel } from './user.view-model';

export class UserQueryService {
  constructor(
    @Inject(TI_SYSTEM_USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    // Currently, we project off the domain (command DB) for user queries
    private readonly commandRepository: ITiSystemUserCommandRepository,
  ) {}

  async fetchById(id: string) {
    const result = await this.commandRepository.fetchById(id);

    if (!result) {
      return result;
    }

    return this.buildView(result).toClientDto();
  }

  private buildView(domainModel: TiSystemUser) {
    return UserViewModel.fromDomainModel(domainModel);
  }
}
