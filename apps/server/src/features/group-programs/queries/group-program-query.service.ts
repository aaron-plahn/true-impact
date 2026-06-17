import { Inject } from '@nestjs/common';
import { GROUP_PROGRAM_QUERY_REPOSITORY_INJECTION_TOKEN } from '../domain/constants';
import type { IGroupProgramQueryRepository } from './group-program-query-repository.interface';
import { GroupProgramViewModel } from './group-program.view-model';

export class GroupProgramQueryService {
  constructor(
    @Inject(GROUP_PROGRAM_QUERY_REPOSITORY_INJECTION_TOKEN)
    private readonly groupProgramQueryRepo: IGroupProgramQueryRepository,
  ) {}

  fetchById(id: string): Promise<GroupProgramViewModel | null> {
    return this.groupProgramQueryRepo.fetchById(id);
  }
}
