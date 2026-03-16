import { Inject } from '@nestjs/common';
import type { ICommunityCommandRepository } from '../commands/repositories/community-command-repository.interface';
import { COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';

export class CommunityValidationService {
  constructor(
    @Inject(COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ICommunityCommandRepository,
  ) {}

  async exists(communityId: string): Promise<boolean> {
    return this.repository.exists(communityId);
  }
}
