import { GroupProgramViewModel } from './group-program.view-model';

export interface IGroupProgramQueryRepository {
  fetchById(id: string): Promise<GroupProgramViewModel | null>;
}
