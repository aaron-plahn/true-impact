import { Inject } from '@nestjs/common';
import { GROUP_PROGRAM_QUERY_REPOSITORY_INJECTION_TOKEN } from '../domain/constants';
import type { IGroupProgramQueryRepository } from './group-program-query-repository.interface';
import { GroupSessionViewModel } from './group-session.view-model';

export class GroupProgramQueryService {
  constructor(
    @Inject(GROUP_PROGRAM_QUERY_REPOSITORY_INJECTION_TOKEN)
    private readonly groupProgramQueryRepo: IGroupProgramQueryRepository,
  ) {}

  fetchById(_id: string): Promise<GroupSessionViewModel | null> {
    throw new Error(`No implementado!`);
  }
}
