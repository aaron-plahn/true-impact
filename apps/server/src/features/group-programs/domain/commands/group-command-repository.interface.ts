import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import { TrueImpactError } from 'src/libs/data-types';
import { GroupProgram } from '../group-program.aggregate-root';

export interface IGroupCommandRepository {
  fetchById(id: string): Promise<GroupProgram | null>;

  create(
    instance: GroupProgram,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
