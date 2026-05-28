import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import { TrueImpactError } from 'src/libs/data-types';
import { TiSystemUser } from '../ti-system-user.aggregate-root';

export interface TiSystemUserCommandRepositoryInterface {
  fetchById(id: string): Promise<TiSystemUser | null>;

  fetchMany(): Promise<TiSystemUser[] | TrueImpactError>;

  create(
    instance: TiSystemUser,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  //   TODO error? Acknowledgement?
  // note that this is currently only used for test setup
  createMany(instances: TiSystemUser[]): Promise<void>;
}
