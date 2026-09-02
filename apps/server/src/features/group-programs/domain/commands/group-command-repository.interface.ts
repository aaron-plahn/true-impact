import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { GroupProgram } from '../group-program.aggregate-root';

export interface IGroupProgramCommandRepository {
  fetchById(id: string): Promise<GroupProgram | null>;

  create(
    instance: GroupProgram,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  update(
    updatedInstance: GroupProgram,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
