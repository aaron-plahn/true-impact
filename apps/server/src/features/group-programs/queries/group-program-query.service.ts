import { Inject } from '@nestjs/common';
import type { IGroupProgramCommandRepository } from '../domain/commands/group-command-repository.interface';
import { GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../domain/constants';
import { GroupProgram } from '../domain/group-program.aggregate-root';
import { GroupProgramViewModel } from './group-program.view-model';

export class GroupProgramQueryService {
  constructor(
    @Inject(GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly groupProgramQueryRepo: IGroupProgramCommandRepository,
  ) {}

  async fetchById(id: string): Promise<GroupProgramViewModel | null> {
    const domainModel = await this.groupProgramQueryRepo.fetchById(id);

    if (!domainModel) {
      return null;
    }

    return this.buildView(domainModel);
  }

  // TODO Fetch many

  private buildView(domainModel: GroupProgram) {
    return GroupProgramViewModel.fromDomainModel(domainModel);
  }
}
