import { Inject } from '@nestjs/common';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IUserCommandRepository } from '../repositories';
import { User } from '../user.aggregate-root';
import { UserViewModel } from './user.view-model';

export class UserQueryService {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    // Currently, we project off the domain (command DB) for user queries
    private readonly commandRepository: IUserCommandRepository,
  ) {}

  async fetchById(id: string) {
    const result = await this.commandRepository.fetchById(id);

    if (!result) {
      return result;
    }

    return this.buildView(result).toClientDto();
  }

  private buildView(domainModel: User) {
    return UserViewModel.fromDomainModel(domainModel);
  }
}
