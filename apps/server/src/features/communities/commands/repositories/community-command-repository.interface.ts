import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { Community } from '../../models';

export interface ICommunityCommandRepository {
  exists(id: string): Promise<boolean>;

  fetchById(id: string): Promise<Community | null>; // Maybe<T>

  fetchMany(): Promise<Community[]>;

  // Error || Ack
  create(
    instance: Community,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: Community[]): Promise<void>;

  update(
    instance: Community,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
