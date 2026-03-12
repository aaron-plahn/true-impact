import { Inject } from '@nestjs/common';
import type { ICommunityCommandRepository } from '../commands/repositories/community-command-repository.interface';
import { COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { Community } from '../models';
import {
  CommunityViewModel,
  CommunityViewModelClientDto,
} from './community.view-model';

export class CommunityQueryService {
  constructor(
    @Inject(COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly commandRepository: ICommunityCommandRepository,
  ) {}

  async fetchById(id: string): Promise<CommunityViewModelClientDto | null> {
    const targetDomainModel = await this.commandRepository.fetchById(id);

    if (!targetDomainModel) {
      return targetDomainModel;
    }

    return this.buildView(targetDomainModel);
  }

  async fetchMany() {
    const domainModels = await this.commandRepository.fetchMany();

    return domainModels.map((dm) => this.buildView(dm));
  }

  private buildView(domainModel: Community) {
    // TODO Is this the right place to convert to the DTO for the client-facing response?
    return CommunityViewModel.fromDomainModel(domainModel).toClientDto();
  }
}
